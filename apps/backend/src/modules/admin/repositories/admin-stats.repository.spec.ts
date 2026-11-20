import { PrismaService } from '@/core/prisma/prisma.service';
import { AdminStatsRepository } from '@/modules/admin/repositories/admin-stats.repository';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('AdminStatsRepository integration against Postgres', () => {
  const prefix = `it-adm-${randomUUID().slice(0, 8)}`;
  const prisma = new PrismaService();
  const repository = new AdminStatsRepository(prisma);
  const hour = 3_600_000;
  const now = new Date();
  // The database holds other rows too, so every assertion is a before/after difference.
  const since = new Date(now.getTime() - hour);
  let categoryId: number;

  const createUser = async (
    name: string,
    options: { onboarded?: boolean; sessions?: Date[] } = {},
  ): Promise<string> => {
    const id = `${prefix}-${name}`;
    await prisma.user.create({
      data: {
        id,
        name: id,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        ...(options.onboarded && {
          profile: { create: { onboardingCompletedAt: now } },
        }),
        sessions: {
          create: (options.sessions ?? []).map((updatedAt, i) => ({
            id: `${id}-s${i}`,
            token: `${id}-t${i}`,
            expiresAt: new Date(now.getTime() + hour),
            createdAt: updatedAt,
            updatedAt,
          })),
        },
      },
    });
    return id;
  };

  const createKvintet = async (
    name: string,
    status: 'FORMING' | 'ACTIVE',
    memberIds: string[],
  ): Promise<void> => {
    await prisma.kvintet.create({
      data: {
        title: `${prefix}-${name}`,
        description: `${prefix} description`,
        status,
        categories: { create: [{ categoryId }] },
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
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

  it('counts users, onboardings and each user once for sessions since the cut-off', async () => {
    const before = await repository.getCounts(since);

    const recent = new Date(now.getTime() - hour / 2);
    const old = new Date(now.getTime() - 2 * hour);
    await createUser('onboarded-twice-active', {
      onboarded: true,
      sessions: [recent, now], // two recent sessions still count as one person
    });
    await createUser('plain-active', { sessions: [recent] });
    await createUser('only-old-session', { sessions: [old] });

    const after = await repository.getCounts(since);

    expect(after.registered - before.registered).toBe(3);
    expect(after.onboarded - before.onboarded).toBe(1);
    expect(after.activeToday - before.activeToday).toBe(2);
  });

  it('counts kvintets by status and lists the member count of each forming one', async () => {
    const before = await repository.getCounts(since);
    const [a, b, c, d] = await Promise.all(
      ['m1', 'm2', 'm3', 'm4'].map((name) => createUser(name)),
    );

    await createKvintet('forming-small', 'FORMING', [a]);
    await createKvintet('forming-ready', 'FORMING', [b, c, d]);
    await createKvintet('started', 'ACTIVE', []);

    const after = await repository.getCounts(since);

    expect(after.kvintets.total - before.kvintets.total).toBe(3);
    expect(after.kvintets.active - before.kvintets.active).toBe(1);
    const added = [...after.formingMemberCounts];
    for (const count of before.formingMemberCounts) {
      added.splice(added.indexOf(count), 1);
    }
    expect(added.sort()).toEqual([1, 3]);
  });
});
