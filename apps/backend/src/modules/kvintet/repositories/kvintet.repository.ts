import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Prisma,
  type KvintetStatus,
  type MeetingFrequency,
  type ProfileTagKind,
} from '@/generated/prisma/client';
import {
  CommonPreferences,
  JoinOutcome,
  KVINTET_CAPACITY,
  KvintetDetails,
  KvintetMemberDetails,
  NewKvintet,
  OpenKvintet,
  StartOutcome,
} from '@/modules/kvintet/domain/kvintet';
import {
  emptyMatchProfile,
  type MatchProfile,
} from '@/modules/matching/matching';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

// The profile fields matching scores, for the caller and for every feed member.
const matchProfileSelect = {
  roles: true,
  weekdays: true,
  weekends: true,
  mornings: true,
  afternoons: true,
  evenings: true,
  latitude: true,
  longitude: true,
  radiusKm: true,
  meetingFrequency: true,
  expectations: true,
  tags: {
    select: {
      kind: true,
      tag: {
        select: {
          slug: true,
          categories: { select: { category: { select: { slug: true } } } },
        },
      },
    },
  },
} satisfies Prisma.ProfileSelect;

type MatchProfileRow = Prisma.ProfileGetPayload<{
  select: typeof matchProfileSelect;
}>;

// Stored as a JSON string array; same fallback as the profile module for older free text.
const parseExpectations = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((e) => typeof e === 'string')
      ? parsed
      : [raw];
  } catch {
    return [raw];
  }
};

const toMatchProfile = (profile: MatchProfileRow | null): MatchProfile =>
  profile
    ? {
        ...profile,
        tags: profile.tags.map(({ kind, tag }) => ({
          slug: tag.slug,
          kind,
          categories: tag.categories.map(({ category }) => category.slug),
        })),
        expectations: parseExpectations(profile.expectations),
      }
    : emptyMatchProfile();

@Injectable()
export class KvintetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isMember(userId: string): Promise<boolean> {
    const member = await this.prisma.kvintetMember.findUnique({
      where: { userId },
      select: { userId: true },
    });
    return member !== null;
  }

  async categoryExists(slug: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return category !== null;
  }

  async findOpenKvintets(categorySlug?: string): Promise<OpenKvintet[]> {
    const kvintets = await this.prisma.kvintet.findMany({
      where: {
        status: 'FORMING',
        members: { some: {} },
        ...(categorySlug
          ? { categories: { some: { category: { slug: categorySlug } } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      // Select only what the feed shows: never the user's name, e-mail or id.
      select: {
        id: true,
        title: true,
        categories: {
          orderBy: { category: { sortOrder: 'asc' } },
          select: { category: { select: { slug: true } } },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            user: {
              select: {
                profile: {
                  select: { position: true, ...matchProfileSelect },
                },
              },
            },
          },
        },
      },
    });

    return kvintets.map((kvintet) => ({
      id: kvintet.id,
      title: kvintet.title,
      categories: kvintet.categories.map(({ category }) => category.slug),
      members: kvintet.members.map(({ user: { profile } }) => {
        const slugsOf = (kind: ProfileTagKind): string[] =>
          (profile?.tags ?? [])
            .filter((tag) => tag.kind === kind)
            .map((tag) => tag.tag.slug);
        return {
          position: profile?.position ?? null,
          meetingFrequency: profile?.meetingFrequency ?? null,
          teach: slugsOf('TEACH'),
          learn: slugsOf('LEARN'),
          interests: slugsOf('INTEREST'),
          // Used only for ranking; the service never sends it to the client.
          match: toMatchProfile(profile),
        };
      }),
    }));
  }

  /** What matching needs about the caller; an empty profile when there is none. */
  async findMatchProfile(userId: string): Promise<MatchProfile> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: matchProfileSelect,
    });
    return toMatchProfile(profile);
  }

  /** Starts a new kvintet (status FORMING) with the caller as its first member. */
  async start(userId: string, input: NewKvintet): Promise<StartOutcome> {
    const categories = await this.prisma.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true, slug: true },
    });
    if (categories.length !== input.categorySlugs.length) {
      return { result: 'unknown_category' };
    }
    const categoryIds = input.categorySlugs.map(
      (slug) => categories.find((category) => category.slug === slug)!.id,
    );

    try {
      // A nested create is one transaction; the unique userId rejects a second kvintet.
      const kvintet = await this.prisma.kvintet.create({
        data: {
          title: input.title,
          description: input.description,
          // Deprecated column, kept until it is dropped: the first chosen category.
          categoryId: categoryIds[0],
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          members: { create: { userId } },
        },
        select: { id: true },
      });
      return { result: 'started', id: kvintet.id };
    } catch (error) {
      if (isUniqueViolation(error)) return { result: 'already_member' };
      throw error;
    }
  }

  /** Locks the kvintet row so two requests cannot both take the last seat. */
  async join(userId: string, kvintetId: string): Promise<JoinOutcome> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ status: KvintetStatus }[]>`
          SELECT "status" FROM "kvintet" WHERE "id" = ${kvintetId}::uuid FOR UPDATE`;
        if (rows.length === 0) return 'not_found';
        if (rows[0].status !== 'FORMING') return 'not_open';

        const members = await tx.kvintetMember.count({ where: { kvintetId } });
        if (members >= KVINTET_CAPACITY) return 'not_open';

        // Votes agreed to the old roster; everyone must vote again.
        await tx.kvintetVote.deleteMany({ where: { kvintetId } });
        await tx.kvintetMember.create({ data: { kvintetId, userId } });
        if (members + 1 === KVINTET_CAPACITY) {
          await tx.kvintet.update({
            where: { id: kvintetId },
            data: { status: 'ACTIVE', activatedAt: new Date() },
          });
        }
        return 'joined';
      });
    } catch (error) {
      // The unique userId on kvintet_member: the caller is already in a kvintet.
      if (isUniqueViolation(error)) return 'already_member';
      throw error;
    }
  }

  async findMembership(userId: string): Promise<{
    kvintetId: string;
    userId: string;
    joinedAt: Date;
    kvintet: {
      id: string;
      status: KvintetStatus;
      title: string;
      createdAt: Date;
      activatedAt: Date | null;
    };
  } | null> {
    return this.prisma.kvintetMember.findUnique({
      where: { userId },
      include: { kvintet: true },
    });
  }

  async findKvintetDetailsByUserId(
    userId: string,
  ): Promise<KvintetDetails | null> {
    const membership = await this.prisma.kvintetMember.findUnique({
      where: { userId },
      include: {
        kvintet: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    profile: {
                      include: {
                        tags: {
                          include: {
                            tag: true,
                          },
                        },
                        city: true,
                      },
                    },
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
            votes: true,
          },
        },
      },
    });

    if (!membership || !membership.kvintet) {
      return null;
    }

    const { kvintet } = membership;
    const isKvintetActive = kvintet.status === 'ACTIVE';

    const members: KvintetMemberDetails[] = kvintet.members.map((m) => {
      const isCurrentUser = m.userId === userId;
      const profile = m.user.profile;
      const tags = profile?.tags ?? [];

      const teachTags = tags
        .filter((t) => t.kind === 'TEACH')
        .map((t) => t.tag.slug);
      const learnTags = tags
        .filter((t) => t.kind === 'LEARN')
        .map((t) => t.tag.slug);
      const interestTags = tags
        .filter((t) => t.kind === 'INTEREST')
        .map((t) => t.tag.slug);

      const hasVoted = kvintet.votes.some((v) => v.userId === m.userId);

      const name = isKvintetActive || isCurrentUser ? m.user.name : null;
      const username = isKvintetActive ? m.user.username : null;
      const role =
        profile?.position ??
        (profile?.roles && profile.roles.length > 0
          ? profile.roles.join(', ')
          : null);

      return {
        userId: m.userId,
        name,
        username,
        role,
        teachTags,
        learnTags,
        interestTags,
        hasVoted,
        isCurrentUser,
      };
    });

    const userHasVoted = kvintet.votes.some((v) => v.userId === userId);
    const totalCount = members.length;
    const votedCount = kvintet.votes.length;
    const canVote =
      kvintet.status === 'FORMING' &&
      totalCount >= 3 &&
      totalCount <= 4 &&
      !userHasVoted;

    const memberProfiles = kvintet.members.map((km) => km.user.profile);
    const hasAnyProfile = memberProfiles.some(Boolean);

    let commonPreferences: CommonPreferences | null = null;

    if (hasAnyProfile && memberProfiles.length > 0) {
      const cities = memberProfiles
        .map((p) => p?.city?.name)
        .filter((c): c is string => Boolean(c));
      const sharedCity =
        cities.length === memberProfiles.length && new Set(cities).size === 1
          ? cities[0]
          : null;

      const frequencies = memberProfiles
        .map((p) => p?.meetingFrequency)
        .filter((f): f is MeetingFrequency => Boolean(f));
      const sharedFrequency =
        frequencies.length === memberProfiles.length &&
        new Set(frequencies).size === 1
          ? frequencies[0]
          : null;

      const weekdays = memberProfiles.every((p) => p?.weekdays === true);
      const weekends = memberProfiles.every((p) => p?.weekends === true);
      const mornings = memberProfiles.every((p) => p?.mornings === true);
      const afternoons = memberProfiles.every((p) => p?.afternoons === true);
      const evenings = memberProfiles.every((p) => p?.evenings === true);

      if (
        sharedCity ||
        sharedFrequency ||
        weekdays ||
        weekends ||
        mornings ||
        afternoons ||
        evenings
      ) {
        commonPreferences = {
          city: sharedCity,
          meetingFrequency: sharedFrequency,
          weekdays,
          weekends,
          mornings,
          afternoons,
          evenings,
        };
      }
    }

    return {
      id: kvintet.id,
      title: kvintet.title,
      status: kvintet.status,
      createdAt: kvintet.createdAt,
      activatedAt: kvintet.activatedAt,
      commonPreferences,
      capacity: KVINTET_CAPACITY,
      openSeatsCount: Math.max(0, KVINTET_CAPACITY - totalCount),
      members,
      voteStatus: {
        canVote,
        userHasVoted,
        votedCount,
        totalCount,
      },
    };
  }

  async vote(kvintetId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "kvintet" WHERE id = ${kvintetId}::uuid FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'Kvintet not found',
        });
      }

      const kvintet = await tx.kvintet.findUnique({
        where: { id: kvintetId },
        include: {
          members: true,
          votes: true,
        },
      });

      if (!kvintet) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'Kvintet not found',
        });
      }

      if (kvintet.status !== 'FORMING') {
        throw new BadRequestException({
          statusCode: 400,
          code: 'bad_request',
          message: 'Voting is only available for proposals',
        });
      }

      const memberCount = kvintet.members.length;
      if (memberCount < 3 || memberCount > 4) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'bad_request',
          message: 'Voting requires 3 or 4 members',
        });
      }

      const isMember = kvintet.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'bad_request',
          message: 'Caller is not a member of this kvintet',
        });
      }

      const existingVote = kvintet.votes.some((v) => v.userId === userId);
      if (existingVote) {
        throw new ConflictException({
          statusCode: 409,
          code: 'conflict',
          message: 'User has already voted',
        });
      }

      await tx.kvintetVote.create({
        data: {
          kvintetId,
          userId,
        },
      });

      const updatedVotesCount = kvintet.votes.length + 1;
      if (updatedVotesCount >= memberCount) {
        await tx.kvintet.update({
          where: { id: kvintetId },
          data: {
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        });
      }
    });
  }

  async leave(kvintetId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "kvintet" WHERE id = ${kvintetId}::uuid FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'Kvintet not found',
        });
      }

      const kvintet = await tx.kvintet.findUnique({
        where: { id: kvintetId },
        include: {
          members: true,
          votes: true,
        },
      });

      if (!kvintet) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'Kvintet not found',
        });
      }

      const isMember = kvintet.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'bad_request',
          message: 'Caller is not a member of this kvintet',
        });
      }

      await tx.kvintetMember.delete({
        where: {
          kvintetId_userId: {
            kvintetId,
            userId,
          },
        },
      });

      const remainingMembers = kvintet.members.filter(
        (m) => m.userId !== userId,
      );

      if (remainingMembers.length === 0) {
        await tx.kvintet.delete({
          where: { id: kvintetId },
        });
      } else if (kvintet.status === 'FORMING') {
        // Votes agreed to the old roster; the rest must vote again.
        await tx.kvintetVote.deleteMany({ where: { kvintetId } });
      }
    });
  }
}
