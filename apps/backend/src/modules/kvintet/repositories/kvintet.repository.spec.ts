import { PrismaService } from '@/core/prisma/prisma.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { emptyMatchProfile } from '@/modules/matching/matching';
import { BadRequestException, ConflictException } from '@nestjs/common';
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
        username: id,
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
        categories: { create: { categoryId } },
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
        categorySlugs: [
          (
            await prisma.category.findUniqueOrThrow({
              where: { id: categoryId },
            })
          ).slug,
        ],
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

  it('starts a kvintet with the caller as its only member and every chosen category', async () => {
    const [user] = await createUsers(1, 'starter');
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 2,
    });

    const outcome = await repository.start(user, {
      title: `${prefix} started`,
      // Reverse order: the feed still lists them in reference order.
      categorySlugs: [categories[1].slug, categories[0].slug],
      description: 'Short description',
    });

    expect(outcome.result).toBe('started');
    const id = outcome.result === 'started' ? outcome.id : '';
    const open = await repository.findOpenKvintets(categories[1].slug);
    expect(open.find((p) => p.id === id)?.categories).toEqual([
      categories[0].slug,
      categories[1].slug,
    ]);
  });

  it('refuses to start a kvintet when any category is unknown', async () => {
    const [user] = await createUsers(1, 'unknown');
    const { slug } = await prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    await expect(
      repository.start(user, {
        title: `${prefix} nope`,
        categorySlugs: [slug, 'does-not-exist'],
        description: null,
      }),
    ).resolves.toEqual({ result: 'unknown_category' });
    await expect(repository.isMember(user)).resolves.toBe(false);
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
    expect(inCategory.every((p) => p.categories.includes(slug))).toBe(true);
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
      categories: [category.slug],
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

  it('loads what matching needs, for the caller and for feed members', async () => {
    const [user, bare] = await createUsers(2, 'matched');
    await prisma.profile.create({
      data: {
        userId: user,
        roles: ['developer'],
        weekdays: true,
        evenings: true,
        latitude: 50.08,
        longitude: 14.44,
        radiusKm: 25,
        meetingFrequency: 'BIWEEKLY',
        expectations: JSON.stringify(['learn_new']),
        tags: {
          create: [{ kind: 'LEARN', tag: { connect: { slug: 'python' } } }],
        },
      },
    });
    const kvintetId = await createKvintet([user]);

    const expected = {
      roles: ['developer'],
      weekdays: true,
      weekends: false,
      evenings: true,
      latitude: 50.08,
      longitude: 14.44,
      radiusKm: 25,
      meetingFrequency: 'BIWEEKLY',
      expectations: ['learn_new'],
      tags: [
        {
          slug: 'python',
          kind: 'LEARN',
          categories: expect.arrayContaining([
            'software-development',
            'data-ai',
          ]) as unknown,
        },
      ],
    };
    await expect(repository.findMatchProfile(user)).resolves.toMatchObject(
      expected,
    );
    const open = await repository.findOpenKvintets();
    expect(
      open.find((p) => p.id === kvintetId)?.members[0].match,
    ).toMatchObject(expected);
    // No profile row at all: every field empty, so matching treats it as neutral.
    await expect(repository.findMatchProfile(bare)).resolves.toEqual(
      emptyMatchProfile(),
    );
  });

  it('retrieves kvintet details, votes, and leaves', async () => {
    const users = await createUsers(3, 'voting');
    const kvintetId = await createKvintet(users);

    const details = await repository.findKvintetDetailsByUserId(users[0]);
    expect(details).not.toBeNull();
    expect(details?.id).toBe(kvintetId);
    expect(details?.status).toBe('FORMING');
    expect(details?.members).toHaveLength(3);
    expect(details?.voteStatus.canVote).toBe(true);
    expect(details?.voteStatus.userHasVoted).toBe(false);

    // Vote user 0
    await repository.vote(kvintetId, users[0]);
    const afterVote0 = await repository.findKvintetDetailsByUserId(users[0]);
    expect(afterVote0?.voteStatus.votedCount).toBe(1);
    expect(afterVote0?.voteStatus.userHasVoted).toBe(true);
    expect(afterVote0?.status).toBe('FORMING');

    // Vote user 1
    await repository.vote(kvintetId, users[1]);

    // Vote user 2 - should activate since all 3 voted
    await repository.vote(kvintetId, users[2]);
    const afterVoteAll = await repository.findKvintetDetailsByUserId(users[0]);
    expect(afterVoteAll?.status).toBe('ACTIVE');
    expect(afterVoteAll?.activatedAt).not.toBeNull();

    // Leave user 0
    await repository.leave(kvintetId, users[0]);
    const afterLeave0 = await repository.findKvintetDetailsByUserId(users[0]);
    expect(afterLeave0).toBeNull();

    const forUser1 = await repository.findKvintetDetailsByUserId(users[1]);
    expect(forUser1?.members).toHaveLength(2);
  });

  it('rejects voting when kvintet is already ACTIVE', async () => {
    const users = await createUsers(3, 'vote-active');
    const kvintetId = await createKvintet(users);

    await repository.vote(kvintetId, users[0]);
    await repository.vote(kvintetId, users[1]);
    await repository.vote(kvintetId, users[2]);

    await expect(repository.vote(kvintetId, users[0])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects voting when proposal has fewer than 3 members', async () => {
    const users = await createUsers(2, 'vote-few');
    const kvintetId = await createKvintet(users);

    await expect(repository.vote(kvintetId, users[0])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects double voting by the same user', async () => {
    const users = await createUsers(3, 'double-vote');
    const kvintetId = await createKvintet(users);

    await repository.vote(kvintetId, users[0]);

    await expect(repository.vote(kvintetId, users[0])).rejects.toThrow(
      ConflictException,
    );
  });

  it('lets a member leave an ACTIVE kvintet, which stays ACTIVE with the rest', async () => {
    const users = await createUsers(4, 'active-leave');
    const kvintetId = await createKvintet(users);
    for (const user of users) await repository.vote(kvintetId, user);

    await repository.leave(kvintetId, users[0]);

    expect(await repository.findKvintetDetailsByUserId(users[0])).toBeNull();
    const remaining = await repository.findKvintetDetailsByUserId(users[1]);
    expect(remaining?.status).toBe('ACTIVE');
    expect(remaining?.members).toHaveLength(3);
  });

  it('deletes kvintet when the last member leaves', async () => {
    const users = await createUsers(1, 'last-leave');
    const kvintetId = await createKvintet(users);

    await repository.leave(kvintetId, users[0]);

    const kvintet = await prisma.kvintet.findUnique({
      where: { id: kvintetId },
    });
    expect(kvintet).toBeNull();
  });

  it('clears votes when a member leaves, so the old roster cannot activate the kvintet', async () => {
    const users = await createUsers(4, 'leave-reset');
    const kvintetId = await createKvintet(users);

    await repository.vote(kvintetId, users[0]);
    await repository.vote(kvintetId, users[1]);
    await repository.vote(kvintetId, users[2]);

    // 4th member leaves (unvoted): the remaining 3 voted for a group of 4
    await repository.leave(kvintetId, users[3]);

    const afterLeave = await repository.findKvintetDetailsByUserId(users[0]);
    expect(afterLeave?.status).toBe('FORMING');
    expect(afterLeave?.members).toHaveLength(3);
    expect(afterLeave?.voteStatus.votedCount).toBe(0);
    expect(afterLeave?.voteStatus.userHasVoted).toBe(false);
  });

  it('does not let votes for the old roster start a kvintet after a leave and a re-join', async () => {
    const users = await createUsers(4, 'leave-join');
    const kvintetId = await createKvintet(users.slice(0, 3));

    await repository.vote(kvintetId, users[0]);
    await repository.vote(kvintetId, users[1]);
    await repository.leave(kvintetId, users[2]);
    await repository.join(users[3], kvintetId);

    // users[0] and users[1] never agreed to users[3]: one vote is not enough
    await repository.vote(kvintetId, users[3]);

    const details = await repository.findKvintetDetailsByUserId(users[0]);
    expect(details?.status).toBe('FORMING');
    expect(details?.voteStatus.votedCount).toBe(1);
  });

  it("hides other members' names while FORMING and shows them once ACTIVE", async () => {
    const users = await createUsers(3, 'names');
    const kvintetId = await createKvintet(users);

    const forming = await repository.findKvintetDetailsByUserId(users[0]);
    expect(forming?.status).toBe('FORMING');
    for (const member of forming?.members ?? []) {
      expect(member.name).toBe(member.isCurrentUser ? users[0] : null);
      expect(member.username).toBeNull();
    }

    for (const user of users) await repository.vote(kvintetId, user);

    const active = await repository.findKvintetDetailsByUserId(users[0]);
    expect(active?.status).toBe('ACTIVE');
    expect(active?.members.map((m) => m.name).sort()).toEqual(
      [...users].sort(),
    );
    expect(active?.members.map((m) => m.username).sort()).toEqual(
      [...users].sort(),
    );
  });
});
