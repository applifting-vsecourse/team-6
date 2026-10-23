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
};

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

    await prisma.kvintet.create({
      data: {
        title: kvintet.title,
        categoryId: category.id,
        members: {
          create: kvintet.members.map((member) => ({
            userId: member.userId,
          })),
        },
      },
    });
  }
}
