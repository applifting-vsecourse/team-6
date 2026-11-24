import { createHmac } from 'crypto';
import {
  PrismaService,
  type TransactionClient,
} from '@/core/prisma/prisma.service';
import {
  Prisma,
  type KvintetStatus,
  type MeetingFrequency,
  type ProfileTagKind,
} from '@/generated/prisma/client';
import { KVINTET_STARTED } from '@/modules/chat/domain/message';
import {
  CommonPreferences,
  FEED_SNAPSHOTS_KEPT,
  FeedSnapshotItem,
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
import { matchingSubject } from '@/modules/matching/subject';
import { Config } from '@/shared/config/config.service';
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

export interface LeaveOptions {
  silentIfNotMember?: boolean;
}

@Injectable()
export class KvintetRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: Config,
  ) {}

  /** Matching data is filed under this instead of the user id (story #176). */
  private subjectOf(userId: string): string {
    return matchingSubject(this.config.betterAuthSecret, userId);
  }

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
        description: true,
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
      description: kvintet.description,
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

  /**
   * Keeps what a feed load listed, for tuning the matching weights. A load that lists the same
   * kvintets in the same order as the user's latest one adds nothing (the feed is loaded from
   * several pages), and only the newest FEED_SNAPSHOTS_KEPT are kept, so no cron is needed.
   */
  async recordFeedSnapshot(
    userId: string,
    fallback: boolean,
    items: FeedSnapshotItem[],
  ): Promise<void> {
    if (items.length === 0) return;
    const order = items.map((item) => item.kvintetId).join();
    const subject = this.subjectOf(userId);
    await this.prisma.$transaction(async (tx) => {
      const latest = await tx.feedSnapshot.findFirst({
        where: { subject },
        orderBy: { id: 'desc' },
        select: { items: true },
      });
      const latestOrder = ((latest?.items ?? []) as FeedSnapshotItem[])
        .map((item) => item.kvintetId)
        .join();
      if (latestOrder === order) return;

      await tx.feedSnapshot.create({ data: { subject, fallback, items } });
      await tx.$executeRaw`
        DELETE FROM "feed_snapshot" WHERE "subject" = ${subject} AND "id" NOT IN (
          SELECT "id" FROM "feed_snapshot" WHERE "subject" = ${subject}
          ORDER BY "id" DESC LIMIT ${FEED_SNAPSHOTS_KEPT})`;
    });
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
      // The unique userId rejects a second kvintet and rolls the whole transaction back.
      return await this.prisma.$transaction(async (tx) => {
        const kvintet = await tx.kvintet.create({
          data: {
            title: input.title,
            description: input.description,
            categories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
            members: { create: { userId } },
          },
          select: { id: true, createdAt: true },
        });
        await tx.kvintetLog.create({
          data: { kvintetId: kvintet.id, createdAt: kvintet.createdAt },
        });
        await tx.membershipLog.create({
          data: {
            subject: this.subjectOf(userId),
            kvintetId: kvintet.id,
            source: 'STARTED',
          },
        });
        return { result: 'started' as const, id: kvintet.id };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { result: 'already_member' };
      throw error;
    }
  }

  /** Opens the chat: the status flips and the chat's first line is posted in the same transaction. */
  private async activateInTransaction(
    tx: TransactionClient,
    kvintetId: string,
  ): Promise<void> {
    const activatedAt = new Date();
    await tx.kvintet.update({
      where: { id: kvintetId },
      data: { status: 'ACTIVE', activatedAt },
    });
    await tx.kvintetLog.updateMany({
      where: { kvintetId },
      data: { activatedAt },
    });
    await tx.message.create({
      data: { kvintetId, kind: 'SYSTEM', body: KVINTET_STARTED },
    });
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
        await this.logJoin(tx, userId, kvintetId);
        if (members + 1 === KVINTET_CAPACITY) {
          await this.activateInTransaction(tx, kvintetId);
        }
        return 'joined';
      });
    } catch (error) {
      // The unique userId on kvintet_member: the caller is already in a kvintet.
      if (isUniqueViolation(error)) return 'already_member';
      throw error;
    }
  }

  /** Records a join, with where the kvintet stood in the caller's latest feed that listed it. */
  private async logJoin(
    tx: TransactionClient,
    userId: string,
    kvintetId: string,
  ): Promise<void> {
    const subject = this.subjectOf(userId);
    const [snapshot] = await tx.$queryRaw<
      { id: number; items: FeedSnapshotItem[] }[]
    >`
      SELECT "id", "items" FROM "feed_snapshot"
      WHERE "subject" = ${subject} AND "items" @> ${JSON.stringify([{ kvintetId }])}::jsonb
      ORDER BY "id" DESC LIMIT 1`;
    const position = snapshot?.items.findIndex(
      (item) => item.kvintetId === kvintetId,
    );
    await tx.membershipLog.create({
      data: {
        subject,
        kvintetId,
        source: 'JOINED',
        ...(snapshot && {
          snapshotId: snapshot.id,
          position,
          listSize: snapshot.items.length,
          score: snapshot.items[position].score,
        }),
      },
    });
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

      // Mask other members' permanent userId while FORMING to preserve anonymity across proposals
      const memberUserId =
        isKvintetActive || isCurrentUser
          ? m.userId
          : `anon-${createHmac('sha256', kvintet.id).update(m.userId).digest('hex').slice(0, 12)}`;

      return {
        userId: memberUserId,
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
      description: kvintet.description,
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
      beginsSeen: membership.beginsSeenAt !== null,
    };
  }

  /**
   * Records that the caller has seen the "Kvintet begins" page. Only an ACTIVE kvintet counts, so
   * a call while it is still forming cannot skip the page, and the first mark wins when called
   * again. Matching no row (not a member) is not an error.
   */
  async markBeginsSeen(userId: string): Promise<void> {
    await this.prisma.kvintetMember.updateMany({
      where: { userId, beginsSeenAt: null, kvintet: { status: 'ACTIVE' } },
      data: { beginsSeenAt: new Date() },
    });
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
        await this.activateInTransaction(tx, kvintetId);
      }
    });
  }

  async leaveInTransaction(
    tx: TransactionClient,
    kvintetId: string,
    userId: string,
    options: LeaveOptions = {},
  ): Promise<void> {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "kvintet" WHERE id = ${kvintetId}::uuid FOR UPDATE
    `;

    if (!locked || locked.length === 0) {
      if (options.silentIfNotMember) return;
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
      if (options.silentIfNotMember) return;
      throw new NotFoundException({
        statusCode: 404,
        code: 'not_found',
        message: 'Kvintet not found',
      });
    }

    const isMember = kvintet.members.some((m) => m.userId === userId);
    if (!isMember) {
      if (options.silentIfNotMember) return;
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

    const remainingMembers = kvintet.members.filter((m) => m.userId !== userId);
    const now = new Date();
    await tx.membershipLog.updateMany({
      where: { subject: this.subjectOf(userId), kvintetId, leftAt: null },
      data: { leftAt: now },
    });

    if (remainingMembers.length === 0) {
      await tx.kvintet.delete({
        where: { id: kvintetId },
      });
      await tx.kvintetLog.updateMany({
        where: { kvintetId },
        data: { endedAt: now },
      });
    } else if (kvintet.status === 'FORMING') {
      // Votes agreed to the old roster; the rest must vote again.
      await tx.kvintetVote.deleteMany({ where: { kvintetId } });
    }
  }

  async leave(
    kvintetId: string,
    userId: string,
    tx?: TransactionClient,
    options?: LeaveOptions,
  ): Promise<void> {
    if (tx) {
      await this.leaveInTransaction(tx, kvintetId, userId, options);
    } else {
      await this.prisma.$transaction((innerTx) =>
        this.leaveInTransaction(innerTx, kvintetId, userId, options),
      );
    }
  }
}
