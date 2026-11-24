import { PrismaService } from '@/core/prisma/prisma.service';
import { AdminExportRepository } from '@/modules/admin/repositories/admin-export.repository';
import { matchingSubject } from '@/modules/matching/subject';
import { Config } from '@/shared/config/config.service';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

// Integration test against the local Postgres, like the other repository specs.
const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('AdminExportRepository (Postgres)', () => {
  const secret = 'export-test-secret';
  const prisma = new PrismaService();
  const repository = new AdminExportRepository(prisma, {
    betterAuthSecret: secret,
  } as Config);
  const userId = `it-export-${randomUUID().slice(0, 8)}`;
  const kvintetId = randomUUID();

  beforeAll(async () => {
    const now = new Date();
    await prisma.user.create({
      data: {
        id: userId,
        name: userId,
        username: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  afterAll(async () => {
    await prisma.membershipLog.deleteMany({ where: { kvintetId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('gives a row from before #176 the same subject a new row would get', async () => {
    const legacy = await prisma.membershipLog.create({
      data: { userId, kvintetId, source: 'STARTED' },
    });
    const fresh = await prisma.membershipLog.create({
      data: {
        subject: matchingSubject(secret, userId),
        kvintetId,
        source: 'JOINED',
      },
    });

    const rows = (await repository.memberships()).filter(
      (row) => row.kvintetId === kvintetId,
    );

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.subject)).size).toBe(1);
    expect(rows[0].subject).toBe(matchingSubject(secret, userId));
    expect(JSON.stringify(rows)).not.toContain(userId);
    await prisma.membershipLog.deleteMany({
      where: { id: { in: [legacy.id, fresh.id] } },
    });
  });
});
