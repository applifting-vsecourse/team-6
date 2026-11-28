import { PrismaService } from '@/core/prisma/prisma.service';
import { AccountRepository } from '@/modules/account/repositories/account.repository';
import { AccountService } from '@/modules/account/services/account.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { NotFoundException } from '@nestjs/common';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('Account integration against Postgres', () => {
  const prefix = `it-acc-${randomUUID().slice(0, 8)}`;
  const prisma = new PrismaService();
  const kvintetRepository = new KvintetRepository(prisma);
  const accountRepository = new AccountRepository(prisma, kvintetRepository);
  const accountService = new AccountService(accountRepository);
  let categoryId: number;
  // Rows the traceless-deletion test leaves behind (they lose their user), removed in afterAll even
  // when an assertion fails halfway.
  const leftover = { snapshots: [] as number[], stays: [] as number[] };
  let tagId: number;

  const createUser = async (name: string): Promise<string> => {
    const id = `${prefix}-${name}`;
    const now = new Date();
    await prisma.user.create({
      data: {
        id,
        name: id,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    return id;
  };

  beforeAll(async () => {
    await prisma.$connect();
    categoryId = (
      await prisma.category.findFirstOrThrow({ select: { id: true } })
    ).id;
    tagId = (await prisma.tag.findFirstOrThrow({ select: { id: true } })).id;
  });

  afterAll(async () => {
    await prisma.membershipLog.deleteMany({
      where: { id: { in: leftover.stays } },
    });
    await prisma.feedSnapshot.deleteMany({
      where: { id: { in: leftover.snapshots } },
    });
    await prisma.verification.deleteMany({
      where: { id: { contains: prefix } },
    });
    await prisma.kvintet.deleteMany({
      where: { title: { startsWith: prefix } },
    });
    await prisma.user.deleteMany({ where: { id: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  it('cascades deletion to profile, profile tags, sessions and accounts', async () => {
    const userId = await createUser('cascade');
    const now = new Date();

    // Create session and account
    await prisma.session.create({
      data: {
        id: `sess-${userId}`,
        token: `tok-${userId}`,
        userId,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.account.create({
      data: {
        id: `acc-${userId}`,
        accountId: userId,
        providerId: 'credential',
        userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create profile and profile tags
    await prisma.profile.create({
      data: {
        userId,
        position: 'Engineer',
        onboardingCompletedAt: now,
        tags: {
          create: [{ tagId, kind: 'TEACH' }],
        },
      },
    });

    await accountService.deleteAccount(userId);

    // Verify user is gone
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeNull();

    // Verify cascaded records are gone
    const session = await prisma.session.findUnique({
      where: { id: `sess-${userId}` },
    });
    expect(session).toBeNull();

    const account = await prisma.account.findUnique({
      where: { id: `acc-${userId}` },
    });
    expect(account).toBeNull();

    const profile = await prisma.profile.findUnique({ where: { userId } });
    expect(profile).toBeNull();

    const profileTags = await prisma.profileTag.findMany({ where: { userId } });
    expect(profileTags).toHaveLength(0);
  });

  it('frees kvintet spot, resets votes, and leaves kvintet when a member deletes account', async () => {
    const u1 = await createUser('kv1');
    const u2 = await createUser('kv2');

    const kvintet = await prisma.kvintet.create({
      data: {
        title: `${prefix} group`,
        description: `${prefix} description`,
        categories: { create: { categoryId } },
        status: 'FORMING',
        members: {
          create: [{ userId: u1 }, { userId: u2 }],
        },
      },
    });

    // u1 votes
    await prisma.kvintetVote.create({
      data: {
        kvintetId: kvintet.id,
        userId: u1,
      },
    });

    // u1 deletes account
    await accountService.deleteAccount(u1);

    // Check user 1 is deleted
    const user1 = await prisma.user.findUnique({ where: { id: u1 } });
    expect(user1).toBeNull();

    // Check kvintet still exists with u2 as only member, and u1's spot is freed
    const updatedKvintet = await prisma.kvintet.findUnique({
      where: { id: kvintet.id },
      include: { members: true, votes: true },
    });
    expect(updatedKvintet).not.toBeNull();
    expect(updatedKvintet!.members).toHaveLength(1);
    expect(updatedKvintet!.members[0].userId).toBe(u2);
    // Votes must be cleared because roster changed
    expect(updatedKvintet!.votes).toHaveLength(0);
  });

  it('deletes kvintet when the last member deletes account', async () => {
    const u = await createUser('sole-member');

    const kvintet = await prisma.kvintet.create({
      data: {
        title: `${prefix} sole group`,
        description: `${prefix} description`,
        categories: { create: { categoryId } },
        status: 'FORMING',
        members: {
          create: [{ userId: u }],
        },
      },
    });

    await accountService.deleteAccount(u);

    const user = await prisma.user.findUnique({ where: { id: u } });
    expect(user).toBeNull();

    const deletedKvintet = await prisma.kvintet.findUnique({
      where: { id: kvintet.id },
    });
    expect(deletedKvintet).toBeNull();
  });

  it('anonymises chat messages when author deletes their account', async () => {
    const u1 = await createUser('chat1');
    const u2 = await createUser('chat2');

    const kvintet = await prisma.kvintet.create({
      data: {
        title: `${prefix} chat group`,
        description: `${prefix} description`,
        categories: { create: { categoryId } },
        status: 'ACTIVE',
        members: {
          create: [{ userId: u1 }, { userId: u2 }],
        },
      },
    });

    const msg = await prisma.message.create({
      data: {
        kvintetId: kvintet.id,
        authorId: u1,
        kind: 'USER',
        body: 'Hello team',
      },
    });

    await accountService.deleteAccount(u1);

    const updatedMsg = await prisma.message.findUnique({
      where: { id: msg.id },
    });
    expect(updatedMsg).not.toBeNull();
    expect(updatedMsg!.authorId).toBeNull();
    expect(updatedMsg!.body).toBe('Hello team');
  });

  it('leaves nothing that finds the deleted user: no verification, no matching-data link, and the e-mail and username can be reused', async () => {
    const userId = await createUser('traceless');
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const now = new Date();
    await prisma.verification.createMany({
      data: [
        {
          id: `ver-email-${userId}`,
          identifier: user.email,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-reset-${userId}`,
          identifier: `reset-password:${prefix}-token`,
          value: userId,
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-otp-${userId}`,
          identifier: `email-verification-otp-${user.email}`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-signin-${userId}`,
          identifier: `sign-in-otp-${user.email.toUpperCase()}`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-forget-${userId}`,
          identifier: `forget-password-otp-${user.email}`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-change-${userId}`,
          identifier: `change-email-otp-${userId}:new-address@example.com`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          // Contains the address as a suffix of a longer local part: someone else's.
          id: `ver-lookalike-${prefix}`,
          identifier: `x${user.email}`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: `ver-other-${prefix}`,
          identifier: `someone-else-${prefix}@example.com`,
          value: 'otp',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ],
    });
    const snapshot = await prisma.feedSnapshot.create({
      data: { userId, fallback: false, items: [] },
    });
    leftover.snapshots.push(snapshot.id);
    const stay = await prisma.membershipLog.create({
      data: {
        userId,
        kvintetId: randomUUID(),
        source: 'STARTED',
        joinedAt: now,
      },
    });
    leftover.stays.push(stay.id);

    await accountService.deleteAccount(userId);

    const left = await prisma.verification.findMany({
      where: {
        id: {
          in: [
            `ver-email-${userId}`,
            `ver-reset-${userId}`,
            `ver-otp-${userId}`,
            `ver-signin-${userId}`,
            `ver-forget-${userId}`,
            `ver-change-${userId}`,
          ],
        },
      },
    });
    expect(left).toHaveLength(0);
    // Someone else's verifications, including a lookalike address, are not touched.
    await expect(
      prisma.verification.count({
        where: {
          id: { in: [`ver-other-${prefix}`, `ver-lookalike-${prefix}`] },
        },
      }),
    ).resolves.toBe(2);
    // The logs stay, with no user to point at.
    await expect(
      prisma.feedSnapshot.findUniqueOrThrow({ where: { id: snapshot.id } }),
    ).resolves.toMatchObject({ userId: null });
    await expect(
      prisma.membershipLog.findUniqueOrThrow({ where: { id: stay.id } }),
    ).resolves.toMatchObject({ userId: null });

    // The same e-mail address and username can sign up again as a new user.
    await prisma.user.create({
      data: {
        id: `${prefix}-again`,
        name: 'New person',
        username: user.username,
        email: user.email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    });
    const again = await prisma.user.findMany({ where: { email: user.email } });
    expect(again.map((u) => u.id)).toEqual([`${prefix}-again`]);
  });

  it("never deletes another user's verifications, however much their address looks like the deleted one", async () => {
    const userId = await createUser('look_alike');
    const { email } = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    // Each of these is a different person's address (`-`, `_`, `%` are all legal in one).
    const others = [
      `foo-${email}`,
      `email-verification-otp-foo-${email}`,
      `sign-in-otp-x:${email}`,
      // `_` is a single-character wildcard in SQL LIKE.
      email.replace('_', 'X'),
      `forget-password-otp-${email.replace('_', 'X')}`,
      `change-email-otp-${userId}X:new@example.com`,
    ];
    await prisma.verification.createMany({
      data: others.map((identifier, i) => ({
        id: `ver-foreign-${i}-${prefix}`,
        identifier,
        value: 'otp',
        expiresAt: new Date(Date.now() + 3600000),
      })),
    });

    await accountService.deleteAccount(userId);

    const survivors = await prisma.verification.findMany({
      where: { id: { startsWith: 'ver-foreign-', endsWith: prefix } },
      select: { identifier: true },
    });
    expect(survivors.map((row) => row.identifier).sort()).toEqual(
      [...others].sort(),
    );
  });

  it('throws NotFoundException when attempting to delete non-existent user', async () => {
    await expect(
      accountRepository.deleteAccount('non-existent-user-id'),
    ).rejects.toThrow(NotFoundException);
  });
});
