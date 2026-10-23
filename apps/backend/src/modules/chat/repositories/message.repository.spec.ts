import { PrismaService } from '@/core/prisma/prisma.service';
import {
  MESSAGE_PAGE_SIZE,
  MESSAGE_POLL_LIMIT,
} from '@/modules/chat/domain/message';
import { MessageRepository } from '@/modules/chat/repositories/message.repository';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

// Integration test against a real Postgres, like kvintet.repository.spec.ts: it
// creates its own users and kvintets under a random prefix and removes them afterwards.

const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('MessageRepository (Postgres)', () => {
  const prefix = `it-${randomUUID().slice(0, 8)}`;
  const prisma = new PrismaService();
  const repository = new MessageRepository(prisma);
  let categoryId: number;

  const createUser = async (name: string): Promise<string> => {
    const id = `${prefix}-${name}`;
    const now = new Date();
    await prisma.user.create({
      data: {
        id,
        name: `Name ${name}`,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    return id;
  };

  const createKvintet = async (
    memberIds: string[],
    status: 'FORMING' | 'ACTIVE' = 'ACTIVE',
  ): Promise<string> => {
    const kvintet = await prisma.kvintet.create({
      data: {
        title: `${prefix} kvintet`,
        status,
        categoryId,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return kvintet.id;
  };

  const seedMessages = async (
    kvintetId: string,
    authorId: string,
    count: number,
  ): Promise<number[]> => {
    const ids: number[] = [];
    for (let index = 0; index < count; index++) {
      const { id } = await prisma.message.create({
        data: { kvintetId, authorId, body: `m${index}` },
      });
      ids.push(id);
    }
    return ids;
  };

  /** What Leave does to chat: lock the kvintet, then delete the membership. */
  const leave = (kvintetId: string, userId: string) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "kvintet" WHERE "id" = ${kvintetId}::uuid FOR UPDATE`;
      await tx.kvintetMember.delete({ where: { userId } });
    });

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

  it('reports where the caller stands', async () => {
    const active = await createUser('access-active');
    const forming = await createUser('access-forming');
    const loner = await createUser('access-none');
    const activeId = await createKvintet([active]);
    const formingId = await createKvintet([forming], 'FORMING');

    await expect(repository.findAccess(active)).resolves.toEqual({
      kvintetId: activeId,
      active: true,
    });
    await expect(repository.findAccess(forming)).resolves.toEqual({
      kvintetId: formingId,
      active: false,
    });
    await expect(repository.findAccess(loner)).resolves.toBeNull();
  });

  it('sends a message and returns it with the author', async () => {
    const author = await createUser('author');
    const kvintetId = await createKvintet([author]);

    const outcome = await repository.send(kvintetId, author, 'Hello');

    expect(outcome).toMatchObject({
      result: 'sent',
      message: {
        kind: 'USER',
        authorId: author,
        authorName: 'Name author',
        authorUsername: author,
        body: 'Hello',
      },
    });
  });

  it('refuses a send into a forming kvintet', async () => {
    const author = await createUser('forming-send');
    const kvintetId = await createKvintet([author], 'FORMING');

    await expect(repository.send(kvintetId, author, 'Hi')).resolves.toEqual({
      result: 'not_active',
    });
    expect(await prisma.message.count({ where: { kvintetId } })).toBe(0);
  });

  it("refuses a send into someone else's kvintet", async () => {
    const [member, outsider] = await Promise.all([
      createUser('own'),
      createUser('outsider'),
    ]);
    const kvintetId = await createKvintet([member]);
    await createKvintet([outsider]);

    await expect(repository.send(kvintetId, outsider, 'Hi')).resolves.toEqual({
      result: 'not_member',
    });
    expect(await prisma.message.count({ where: { kvintetId } })).toBe(0);
  });

  it('answers not_member for a kvintet that is gone', async () => {
    const user = await createUser('ghost');

    await expect(repository.send(randomUUID(), user, 'Hi')).resolves.toEqual({
      result: 'not_member',
    });
  });

  it('keeps ids in the order messages commit under concurrent sends', async () => {
    const authors = await Promise.all(
      Array.from({ length: 5 }, (_, i) => createUser(`burst${i}`)),
    );
    const kvintetId = await createKvintet(authors);

    await Promise.all(
      authors.flatMap((author) =>
        [1, 2, 3].map((n) => repository.send(kvintetId, author, `msg ${n}`)),
      ),
    );

    const messages = await repository.list(kvintetId, {});
    expect(messages).toHaveLength(15);
    const ids = messages.map((message) => message.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    const times = messages.map((message) => message.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('never lets a message land after its author left', async () => {
    const [stayer, leaver] = await Promise.all([
      createUser('stayer'),
      createUser('leaver'),
    ]);
    const kvintetId = await createKvintet([stayer, leaver]);

    const [outcome] = await Promise.all([
      repository.send(kvintetId, leaver, 'last words'),
      leave(kvintetId, leaver),
    ]);

    const stored = await prisma.message.count({ where: { kvintetId } });
    expect(stored).toBe(outcome.result === 'sent' ? 1 : 0);
    await expect(repository.send(kvintetId, leaver, 'again')).resolves.toEqual({
      result: 'not_member',
    });
    expect(await prisma.message.count({ where: { kvintetId } })).toBe(stored);
  });

  it('pages: latest 50, then older with before, newer with after', async () => {
    const author = await createUser('pager');
    const kvintetId = await createKvintet([author]);
    const ids = await seedMessages(kvintetId, author, 120);

    const latest = await repository.list(kvintetId, {});
    expect(latest.map((m) => m.id)).toEqual(ids.slice(-MESSAGE_PAGE_SIZE));

    const older = await repository.list(kvintetId, { before: latest[0].id });
    expect(older.map((m) => m.id)).toEqual(
      ids.slice(-2 * MESSAGE_PAGE_SIZE, -MESSAGE_PAGE_SIZE),
    );

    const firstPoll = await repository.list(kvintetId, { after: 0 });
    expect(firstPoll.map((m) => m.id)).toEqual(
      ids.slice(0, MESSAGE_POLL_LIMIT),
    );
    const secondPoll = await repository.list(kvintetId, {
      after: firstPoll[firstPoll.length - 1].id,
    });
    expect(secondPoll.map((m) => m.id)).toEqual(ids.slice(MESSAGE_POLL_LIMIT));
    await expect(
      repository.list(kvintetId, { after: ids[ids.length - 1] }),
    ).resolves.toEqual([]);
  });

  it("does not leak another kvintet's messages", async () => {
    const [a, b] = await Promise.all([
      createUser('iso-a'),
      createUser('iso-b'),
    ]);
    const kvintetA = await createKvintet([a]);
    const kvintetB = await createKvintet([b]);
    await seedMessages(kvintetA, a, 2);
    await seedMessages(kvintetB, b, 3);

    const seenByA = await repository.list(kvintetA, { after: 0 });
    expect(seenByA).toHaveLength(2);
    expect(seenByA.every((message) => message.authorId === a)).toBe(true);
  });

  it('anonymises messages when the author deletes their account', async () => {
    const [stayer, author] = await Promise.all([
      createUser('anon-stayer'),
      createUser('anon-author'),
    ]);
    const kvintetId = await createKvintet([stayer, author]);
    await seedMessages(kvintetId, author, 1);

    await prisma.user.delete({ where: { id: author } });

    await expect(repository.list(kvintetId, {})).resolves.toMatchObject([
      { authorId: null, authorName: null, authorUsername: null, body: 'm0' },
    ]);
  });

  it('deletes the messages together with their kvintet', async () => {
    const author = await createUser('cascade');
    const kvintetId = await createKvintet([author]);
    await seedMessages(kvintetId, author, 2);

    await prisma.kvintet.delete({ where: { id: kvintetId } });

    expect(await prisma.message.count({ where: { kvintetId } })).toBe(0);
  });
});
