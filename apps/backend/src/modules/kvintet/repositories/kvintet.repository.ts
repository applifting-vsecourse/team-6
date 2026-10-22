import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Prisma,
  type KvintetStatus,
  type ProfileTagKind,
} from '@/generated/prisma/client';
import {
  JoinOutcome,
  KVINTET_CAPACITY,
  NewKvintet,
  OpenKvintet,
  StartOutcome,
} from '@/modules/kvintet/domain/kvintet';
import { Injectable } from '@nestjs/common';

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

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
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      // Select only what the feed shows: never the user's name, e-mail or id.
      select: {
        id: true,
        title: true,
        category: { select: { slug: true } },
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            user: {
              select: {
                profile: {
                  select: {
                    position: true,
                    meetingFrequency: true,
                    tags: {
                      select: { kind: true, tag: { select: { slug: true } } },
                    },
                  },
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
      category: kvintet.category.slug,
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
        };
      }),
    }));
  }

  /** Starts a new kvintet (status FORMING) with the caller as its first member. */
  async start(userId: string, input: NewKvintet): Promise<StartOutcome> {
    const category = await this.prisma.category.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true },
    });
    if (!category) return { result: 'unknown_category' };

    try {
      // A nested create is one transaction; the unique userId rejects a second kvintet.
      const kvintet = await this.prisma.kvintet.create({
        data: {
          title: input.title,
          description: input.description,
          categoryId: category.id,
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
}
