import { PrismaService } from '@/core/prisma/prisma.service';
import { KVINTET_STARTED } from '@/modules/chat/domain/message';
import { FEED_SNAPSHOTS_KEPT } from '@/modules/kvintet/domain/kvintet';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { emptyMatchProfile } from '@/modules/matching/matching';
import { matchingSubject } from '@/modules/matching/subject';
import { Config } from '@/shared/config/config.service';
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
  const secret = 'integration-test-secret';
  const repository = new KvintetRepository(prisma, {
    betterAuthSecret: secret,
  } as Config);
  const subjectOf = (userId: string): string => matchingSubject(secret, userId);
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
        description: `${prefix} description`,
        categories: { create: { categoryId } },
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return kvintet.id;
  };

  /** Bodies of the SYSTEM lines in a kvintet's chat. */
  const startedLines = async (kvintetId: string): Promise<string[]> =>
    (
      await prisma.message.findMany({
        where: { kvintetId, kind: 'SYSTEM' },
        select: { body: true },
      })
    ).map((message) => message.body);

  beforeAll(async () => {
    await prisma.$connect();
    categoryId = (
      await prisma.category.findFirstOrThrow({ select: { id: true } })
    ).id;
  });

  afterAll(async () => {
    // The matching-data logs have no foreign key to kvintet, so remove them by hand.
    const users = await prisma.user.findMany({
      where: { id: { startsWith: prefix } },
      select: { id: true },
    });
    const subjects = users.map(({ id }) => subjectOf(id));
    const logged = await prisma.membershipLog.findMany({
      where: { subject: { in: subjects } },
      select: { kvintetId: true },
    });
    await prisma.kvintetLog.deleteMany({
      where: { kvintetId: { in: logged.map((log) => log.kvintetId) } },
    });
    await prisma.membershipLog.deleteMany({
      where: { subject: { in: subjects } },
    });
    await prisma.feedSnapshot.deleteMany({
      where: { subject: { in: subjects } },
    });
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
    await expect(startedLines(kvintetId)).resolves.toEqual([KVINTET_STARTED]);
  });

  it('keeps a kvintet FORMING until the fifth member joins', async () => {
    const [first, second] = await createUsers(2, 'forming');
    const kvintetId = await createKvintet([first]);

    await expect(repository.join(second, kvintetId)).resolves.toBe('joined');

    const kvintet = await prisma.kvintet.findUniqueOrThrow({
      where: { id: kvintetId },
    });
    expect(kvintet.status).toBe('FORMING');
    await expect(startedLines(kvintetId)).resolves.toEqual([]);
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
        description: `${prefix} description`,
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
    const started = open.find((p) => p.id === id);
    expect(started?.categories).toEqual([
      categories[0].slug,
      categories[1].slug,
    ]);
    expect(started?.description).toBe('Short description');
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
        description: `${prefix} description`,
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
    expect(details?.description).toBe(`${prefix} description`);
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
    await expect(startedLines(kvintetId)).resolves.toEqual([]);

    // Vote user 1
    await repository.vote(kvintetId, users[1]);

    // Vote user 2 - should activate since all 3 voted
    await repository.vote(kvintetId, users[2]);
    const afterVoteAll = await repository.findKvintetDetailsByUserId(users[0]);
    expect(afterVoteAll?.status).toBe('ACTIVE');
    expect(afterVoteAll?.activatedAt).not.toBeNull();
    await expect(startedLines(kvintetId)).resolves.toEqual([KVINTET_STARTED]);

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

  it("hides other members' names and masks userIds while FORMING and reveals them once ACTIVE", async () => {
    const users = await createUsers(3, 'names');
    const kvintetId = await createKvintet(users);

    const forming = await repository.findKvintetDetailsByUserId(users[0]);
    expect(forming?.status).toBe('FORMING');
    for (const member of forming?.members ?? []) {
      expect(member.name).toBe(member.isCurrentUser ? users[0] : null);
      expect(member.username).toBeNull();
      if (!member.isCurrentUser) {
        expect(member.userId).toMatch(/^anon-/);
        expect(member.userId).not.toBe(users[1]);
        expect(member.userId).not.toBe(users[2]);
      } else {
        expect(member.userId).toBe(users[0]);
      }
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
    expect(active?.members.map((m) => m.userId).sort()).toEqual(
      [...users].sort(),
    );
  });

  it('marks the begins page as seen only once the kvintet is ACTIVE, and keeps the first mark', async () => {
    const users = await createUsers(3, 'begins');
    const kvintetId = await createKvintet(users);

    // Still forming: the mark is refused silently, so the page cannot be skipped.
    await repository.markBeginsSeen(users[0]);
    expect(
      (await repository.findKvintetDetailsByUserId(users[0]))?.beginsSeen,
    ).toBe(false);

    for (const user of users) await repository.vote(kvintetId, user);
    expect(
      (await repository.findKvintetDetailsByUserId(users[0]))?.beginsSeen,
    ).toBe(false);

    await repository.markBeginsSeen(users[0]);
    const first = await prisma.kvintetMember.findUniqueOrThrow({
      where: { userId: users[0] },
    });
    await repository.markBeginsSeen(users[0]);
    const again = await prisma.kvintetMember.findUniqueOrThrow({
      where: { userId: users[0] },
    });

    expect(first.beginsSeenAt).not.toBeNull();
    expect(again.beginsSeenAt).toEqual(first.beginsSeenAt);
    // The mark is per member: the others still have to see it.
    expect(
      (await repository.findKvintetDetailsByUserId(users[0]))?.beginsSeen,
    ).toBe(true);
    expect(
      (await repository.findKvintetDetailsByUserId(users[1]))?.beginsSeen,
    ).toBe(false);
  });

  it('does not fail for a user who is in no kvintet', async () => {
    const [user] = await createUsers(1, 'begins-none');

    await expect(repository.markBeginsSeen(user)).resolves.toBeUndefined();
  });

  describe('matching data log', () => {
    it('logs where the kvintet stood in the latest feed that listed it, and nothing when it was not listed', async () => {
      const [owner, fromFeed, deepLink] = await createUsers(3, 'log-join');
      const kvintetId = await createKvintet([owner]);
      const other = randomUUID();
      await repository.recordFeedSnapshot(fromFeed, false, [
        { kvintetId: other, score: 80 },
        { kvintetId, score: 42.5 },
      ]);

      await repository.join(fromFeed, kvintetId);
      await repository.join(deepLink, kvintetId);

      const [viaFeed, viaLink] = await Promise.all(
        [fromFeed, deepLink].map((userId) =>
          prisma.membershipLog.findFirstOrThrow({
            where: { subject: subjectOf(userId) },
          }),
        ),
      );
      expect(viaFeed).toMatchObject({
        kvintetId,
        source: 'JOINED',
        position: 1,
        listSize: 2,
        score: 42.5,
        leftAt: null,
      });
      expect(viaFeed.snapshotId).not.toBeNull();
      expect(viaLink).toMatchObject({
        source: 'JOINED',
        snapshotId: null,
        position: null,
        listSize: null,
        score: null,
      });
    });

    it('logs a started kvintet, its start and its disbanding, and the time each member left', async () => {
      const [starter, joiner] = await createUsers(2, 'log-life');
      const outcome = await repository.start(starter, {
        title: `${prefix} logged`,
        description: `${prefix} description`,
        categorySlugs: ['languages'],
      });
      if (outcome.result !== 'started') throw new Error('not started');
      const kvintetId = outcome.id;
      await repository.join(joiner, kvintetId);

      await expect(
        prisma.membershipLog.findFirstOrThrow({
          where: { subject: subjectOf(starter) },
        }),
      ).resolves.toMatchObject({ kvintetId, source: 'STARTED' });
      await expect(
        prisma.kvintetLog.findUniqueOrThrow({ where: { kvintetId } }),
      ).resolves.toMatchObject({ activatedAt: null, endedAt: null });

      await repository.leave(kvintetId, joiner);
      const left = await prisma.membershipLog.findFirstOrThrow({
        where: { subject: subjectOf(joiner) },
      });
      expect(left.leftAt).not.toBeNull();
      await expect(
        prisma.kvintetLog.findUniqueOrThrow({ where: { kvintetId } }),
      ).resolves.toMatchObject({ endedAt: null });

      await repository.leave(kvintetId, starter);
      const ended = await prisma.kvintetLog.findUniqueOrThrow({
        where: { kvintetId },
      });
      expect(ended.endedAt).not.toBeNull();
    });

    it('logs when a kvintet starts, and keeps the rows anonymous after the account is deleted', async () => {
      const members = await createUsers(4, 'log-start');
      const [last] = await createUsers(1, 'log-last');
      const kvintetId = await createKvintet(members);
      await prisma.kvintetLog.create({
        data: { kvintetId, createdAt: new Date() },
      });

      await repository.join(last, kvintetId);
      await repository.leave(kvintetId, last);
      await prisma.user.delete({ where: { id: last } });

      const log = await prisma.kvintetLog.findUniqueOrThrow({
        where: { kvintetId },
      });
      expect(log.activatedAt).not.toBeNull();
      const stay = await prisma.membershipLog.findFirstOrThrow({
        where: { kvintetId, source: 'JOINED' },
      });
      expect(stay.subject).toBe(subjectOf(last));
      expect(stay.leftAt).not.toBeNull();
    });

    it('keeps no reference to the user in the matching tables, and the subject is not the user id', async () => {
      const [user] = await createUsers(1, 'log-anon');
      await repository.recordFeedSnapshot(user, false, [
        { kvintetId: randomUUID(), score: 10 },
      ]);
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name IN ('feed_snapshot', 'membership_log', 'kvintet_log')`;
      expect(columns.map((c) => c.column_name)).not.toContain('userId');
      const foreignKeys = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY' AND constraint_name IN
          ('feed_snapshot_userId_fkey', 'membership_log_userId_fkey')`;
      expect(Number(foreignKeys[0].n)).toBe(0);
      const snapshot = await prisma.feedSnapshot.findFirstOrThrow({
        where: { subject: subjectOf(user) },
      });
      expect(JSON.stringify(snapshot)).not.toContain(user);
    });

    it('keeps one snapshot for an unchanged feed and only the newest fifty per user', async () => {
      const [user] = await createUsers(1, 'log-feed');
      const ids = Array.from({ length: FEED_SNAPSHOTS_KEPT + 2 }, () =>
        randomUUID(),
      );

      await repository.recordFeedSnapshot(user, false, []);
      await repository.recordFeedSnapshot(user, false, [
        { kvintetId: ids[0], score: 50 },
      ]);
      await repository.recordFeedSnapshot(user, false, [
        { kvintetId: ids[0], score: 51 },
      ]);
      expect(
        await prisma.feedSnapshot.count({
          where: { subject: subjectOf(user) },
        }),
      ).toBe(1);

      for (const id of ids.slice(1)) {
        await repository.recordFeedSnapshot(user, true, [
          { kvintetId: id, score: 10 },
        ]);
      }

      expect(
        await prisma.feedSnapshot.count({
          where: { subject: subjectOf(user) },
        }),
      ).toBe(FEED_SNAPSHOTS_KEPT);
    });
  });
});
