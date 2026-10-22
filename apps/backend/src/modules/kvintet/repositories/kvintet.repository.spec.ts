import { PrismaService } from '@/core/prisma/prisma.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

// Integration test against a real Postgres (the one DATABASE_URL points at: the
// local docker database or the CI service). It creates its own users and
// kvintets under a random prefix and removes them afterwards.

const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('KvintetRepository (Postgres)', () => {
  const prefix = `it-${randomUUID().slice(0, 8)}`;
  const prisma = new PrismaService();
  const repository = new KvintetRepository(prisma);
  let categoryId: number;

  const createUser = async (name: string): Promise<string> => {
    const id = `${prefix}-${name}`;
    const now = new Date();
    await prisma.user.create({
      data: {
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    return id;
  };

  const createUsers = (count: number, label: string): Promise<string[]> =>
    Promise.all(
      Array.from({ length: count }, (_, index) =>
        createUser(`${label}${index}`),
      ),
    );

  const createKvintet = async (memberIds: string[]): Promise<string> => {
    const kvintet = await prisma.kvintet.create({
      data: {
        title: `${prefix} kvintet`,
        categoryId,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return kvintet.id;
  };

  beforeAll(async () => {
    await prisma.$connect();
    categoryId = (
      await prisma.category.findFirstOrThrow({ select: { id: true } })
    ).id;
  });

  afterAll(async () => {
    await prisma.kvintet.deleteMany({
      where: { title: { startsWith: prefix } },
    });
    await prisma.user.deleteMany({ where: { id: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  it('lets exactly one of many concurrent joins take the last seat', async () => {
    const members = await createUsers(4, 'member');
    const contenders = await createUsers(8, 'contender');
    const kvintetId = await createKvintet(members);

    const outcomes = await Promise.all(
      contenders.map((userId) => repository.join(userId, kvintetId)),
    );

    expect(outcomes.filter((o) => o === 'joined')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'not_open')).toHaveLength(7);
    const kvintet = await prisma.kvintet.findUniqueOrThrow({
      where: { id: kvintetId },
      include: { _count: { select: { members: true } } },
    });
    expect(kvintet.status).toBe('ACTIVE');
    expect(kvintet.activatedAt).not.toBeNull();
    expect(kvintet._count.members).toBe(5);
  });

  it('keeps a kvintet FORMING until the fifth member joins', async () => {
    const [first, second] = await createUsers(2, 'forming');
    const kvintetId = await createKvintet([first]);

    await expect(repository.join(second, kvintetId)).resolves.toBe('joined');

    const kvintet = await prisma.kvintet.findUniqueOrThrow({
      where: { id: kvintetId },
    });
    expect(kvintet.status).toBe('FORMING');
  });

  it('refuses a user who is already in a kvintet, in this one or another', async () => {
    const [owner, other] = await createUsers(2, 'taken');
    const mine = await createKvintet([owner]);
    const theirs = await createKvintet([other]);

    await expect(repository.join(owner, mine)).resolves.toBe('already_member');
    await expect(repository.join(owner, theirs)).resolves.toBe(
      'already_member',
    );
    await expect(
      repository.start(owner, {
        title: `${prefix} second`,
        categorySlug: (
          await prisma.category.findUniqueOrThrow({ where: { id: categoryId } })
        ).slug,
        description: null,
      }),
    ).resolves.toEqual({ result: 'already_member' });
  });

  it('answers not_found for a kvintet that does not exist', async () => {
    const [user] = await createUsers(1, 'lost');

    await expect(repository.join(user, randomUUID())).resolves.toBe(
      'not_found',
    );
  });

  it('starts a kvintet with the caller as its only member', async () => {
    const [user] = await createUsers(1, 'starter');
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    const outcome = await repository.start(user, {
      title: `${prefix} started`,
      categorySlug: category.slug,
      description: 'Short description',
    });

    expect(outcome.result).toBe('started');
    await expect(
      repository.start(user, {
        title: `${prefix} nope`,
        categorySlug: 'does-not-exist',
        description: null,
      }),
    ).resolves.toEqual({ result: 'unknown_category' });
  });

  it('lists only the kvintets of the requested category', async () => {
    const [user] = await createUsers(1, 'filtered');
    const kvintetId = await createKvintet([user]);
    const { slug } = await prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });
    const other = await prisma.category.findFirstOrThrow({
      where: { id: { not: categoryId } },
    });

    const inCategory = await repository.findOpenKvintets(slug);
    const inOther = await repository.findOpenKvintets(other.slug);

    expect(inCategory.map((p) => p.id)).toContain(kvintetId);
    expect(inCategory.every((p) => p.category === slug)).toBe(true);
    expect(inOther.map((p) => p.id)).not.toContain(kvintetId);
  });

  it('knows which category slugs exist', async () => {
    const { slug } = await prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    await expect(repository.categoryExists(slug)).resolves.toBe(true);
    await expect(repository.categoryExists('does-not-exist')).resolves.toBe(
      false,
    );
  });

  it('lists open kvintets by role and tags only', async () => {
    const [user] = await createUsers(1, 'listed');
    await prisma.profile.create({
      data: {
        userId: user,
        position: 'Accountant',
        meetingFrequency: 'WEEKLY',
        tags: {
          create: [
            {
              kind: 'TEACH',
              tag: { connect: { slug: 'excel' } },
            },
          ],
        },
      },
    });
    const kvintetId = await createKvintet([user]);
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    const open = await repository.findOpenKvintets();

    expect(open.find((p) => p.id === kvintetId)).toMatchObject({
      category: category.slug,
      members: [
        {
          position: 'Accountant',
          meetingFrequency: 'WEEKLY',
          teach: ['excel'],
          learn: [],
          interests: [],
        },
      ],
    });
  });
});
