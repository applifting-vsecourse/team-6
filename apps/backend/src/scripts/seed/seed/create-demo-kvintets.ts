import { PrismaService } from '@/core/prisma/prisma.service';
import { MeetingFrequency } from '@/generated/prisma/client';
import { KVINTET_STARTED } from '@/modules/chat/domain/message';

export type DemoMember = {
  userId: string;
  position: string;
  // Role names from the onboarding picker.
  roles?: string[];
  meetingFrequency: MeetingFrequency;
  teach: string[];
  learn: string[];
  interests: string[];
  // Where and when they can meet, so the feed ranking differs between accounts.
  // Defaults: Praha, 25 km, weekday evenings, wants to learn something new.
  place?: keyof typeof PLACES;
  radiusKm?: number;
  availability?: Partial<
    Record<
      'weekdays' | 'weekends' | 'mornings' | 'afternoons' | 'evenings',
      boolean
    >
  >;
  expectations?: string[];
};

const PLACES = {
  praha: { latitude: 50.0755, longitude: 14.4378 },
  brno: { latitude: 49.1951, longitude: 16.6068 },
};

type DemoKvintet = {
  title: string;
  categories: string[];
  members: DemoMember[];
  // Full and agreed on.
  active?: boolean;
  // How many of the first members have already voted to start.
  votes?: number;
  // What the group has written so far, oldest first. `from` is an index into `members`.
  chat?: { from: number; body: string; minutesAgo: number }[];
  // How many chat lines each member (by index) has read; everyone else has read all of them.
  // The rest count as unread for them, except their own.
  readCounts?: Record<number, number>;
};

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60_000);

// Local demo data only: the feed is empty until someone has a profile and a kvintet.
// shortcut: writes profiles and tags directly because nothing else does yet; once the
// onboarding story (#7) saves them, create demo profiles through its code instead.
export async function createDemoProfiles(
  prisma: PrismaService,
  members: DemoMember[],
): Promise<void> {
  const tags = new Map(
    (await prisma.tag.findMany()).map((tag) => [tag.slug, tag.id]),
  );
  const tagId = (slug: string): number => {
    const id = tags.get(slug);
    if (id === undefined) throw new Error(`Unknown tag: ${slug}`);
    return id;
  };

  for (const member of members) {
    await prisma.profile.create({
      data: {
        userId: member.userId,
        // Without it the guards send a demo user back to onboarding.
        onboardingCompletedAt: new Date(),
        position: member.position,
        roles: member.roles ?? [],
        meetingFrequency: member.meetingFrequency,
        ...PLACES[member.place ?? 'praha'],
        radiusKm: member.radiusKm ?? 25,
        ...(member.availability ?? { weekdays: true, evenings: true }),
        expectations: JSON.stringify(member.expectations ?? ['learn_new']),
        tags: {
          create: [
            ...member.teach.map((slug) => ({
              tagId: tagId(slug),
              kind: 'TEACH' as const,
            })),
            ...member.learn.map((slug) => ({
              tagId: tagId(slug),
              kind: 'LEARN' as const,
            })),
            ...member.interests.map((slug) => ({
              tagId: tagId(slug),
              kind: 'INTEREST' as const,
            })),
          ],
        },
      },
    });
  }
}

export async function createDemoKvintets(
  prisma: PrismaService,
  kvintets: DemoKvintet[],
): Promise<void> {
  for (const kvintet of kvintets) {
    const categoryIds = await Promise.all(
      kvintet.categories.map(
        async (slug) =>
          (await prisma.category.findUniqueOrThrow({ where: { slug } })).id,
      ),
    );

    await createDemoProfiles(prisma, kvintet.members);

    const created = await prisma.kvintet.create({
      data: {
        title: kvintet.title,
        categoryId: categoryIds[0],
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
        status: kvintet.active ? 'ACTIVE' : 'FORMING',
        activatedAt: kvintet.active ? minutesAgo(2 * 24 * 60) : null,
        members: {
          create: kvintet.members.map((member) => ({
            userId: member.userId,
          })),
        },
      },
    });

    let startedId = 0;
    if (kvintet.active) {
      startedId = (
        await prisma.message.create({
          data: {
            kvintetId: created.id,
            kind: 'SYSTEM',
            body: KVINTET_STARTED,
            createdAt: created.activatedAt ?? undefined,
          },
        })
      ).id;
    }

    const chat = kvintet.chat ?? [];
    const chatIds: number[] = [];
    for (const line of chat) {
      const message = await prisma.message.create({
        data: {
          kvintetId: created.id,
          authorId: kvintet.members[line.from].userId,
          kind: 'USER',
          body: line.body,
          createdAt: minutesAgo(line.minutesAgo),
        },
      });
      chatIds.push(message.id);
    }

    // The read mark is the id of the newest line a member has seen.
    for (const [index, member] of kvintet.members.entries()) {
      const readCount = kvintet.readCounts?.[index] ?? chat.length;
      await prisma.kvintetMember.update({
        where: {
          kvintetId_userId: { kvintetId: created.id, userId: member.userId },
        },
        data: {
          lastReadMessageId: readCount > 0 ? chatIds[readCount - 1] : startedId,
        },
      });
    }

    await prisma.kvintetVote.createMany({
      data: kvintet.members
        .slice(0, kvintet.votes ?? 0)
        .map((member) => ({ kvintetId: created.id, userId: member.userId })),
    });
  }
}
