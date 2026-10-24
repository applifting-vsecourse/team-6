import { PrismaService } from '@/core/prisma/prisma.service';
import { MeetingFrequency } from '@/generated/prisma/client';

type DemoMember = {
  userId: string;
  position: string;
  meetingFrequency: MeetingFrequency;
  teach: string[];
  learn: string[];
  interests: string[];
};

type DemoKvintet = {
  title: string;
  category: string;
  members: DemoMember[];
  // Full and agreed on.
  active?: boolean;
  // How many of the first members have already voted to start.
  votes?: number;
};

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60_000);

// Local demo data only: the feed is empty until someone has a profile and a kvintet.
// shortcut: writes profiles and tags directly because nothing else does yet; once the
// onboarding story (#7) saves them, create demo profiles through its code instead.
export async function createDemoKvintets(
  prisma: PrismaService,
  kvintets: DemoKvintet[],
): Promise<void> {
  const tags = new Map(
    (await prisma.tag.findMany()).map((tag) => [tag.slug, tag.id]),
  );
  const tagId = (slug: string): number => {
    const id = tags.get(slug);
    if (id === undefined) throw new Error(`Unknown tag: ${slug}`);
    return id;
  };

  for (const kvintet of kvintets) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: kvintet.category },
    });

    for (const member of kvintet.members) {
      await prisma.profile.create({
        data: {
          userId: member.userId,
          // Without it the guards send a demo user back to onboarding.
          onboardingCompletedAt: new Date(),
          position: member.position,
          meetingFrequency: member.meetingFrequency,
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

    const created = await prisma.kvintet.create({
      data: {
        title: kvintet.title,
        categoryId: category.id,
        status: kvintet.active ? 'ACTIVE' : 'FORMING',
        activatedAt: kvintet.active ? minutesAgo(2 * 24 * 60) : null,
        members: {
          create: kvintet.members.map((member) => ({
            userId: member.userId,
          })),
        },
      },
    });

    await prisma.kvintetVote.createMany({
      data: kvintet.members
        .slice(0, kvintet.votes ?? 0)
        .map((member) => ({ kvintetId: created.id, userId: member.userId })),
    });
  }
}
