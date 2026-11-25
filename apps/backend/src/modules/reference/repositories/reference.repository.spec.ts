import { PrismaService } from '@/core/prisma/prisma.service';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

// Integration test against a real Postgres (the one DATABASE_URL points at: the
// local docker database or the CI service). It creates its own categories and
// tags under a random prefix and removes them afterwards.

const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://unset')
  .hostname;
if (!['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseHost}": use a local database.`,
  );
}

describe('ReferenceRepository (Postgres)', () => {
  const prefix = `it-${randomUUID().slice(0, 8)}`;
  const prisma = new PrismaService();
  const repository = new ReferenceRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
    // Created in reverse sort order, so the result cannot pass by insertion order.
    const second = await prisma.category.create({
      data: { slug: `${prefix}-second`, sortOrder: 90002 },
    });
    const first = await prisma.category.create({
      data: { slug: `${prefix}-first`, sortOrder: 90001 },
    });
    await prisma.tag.create({
      data: {
        slug: `${prefix}-both`,
        categories: {
          create: [{ categoryId: second.id }, { categoryId: first.id }],
        },
      },
    });
    await prisma.tag.create({ data: { slug: `${prefix}-none` } });
  });

  afterAll(async () => {
    // tag_category rows go with their tag and category (ON DELETE CASCADE).
    await prisma.tag.deleteMany({ where: { slug: { startsWith: prefix } } });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await prisma.$disconnect();
  });

  it('returns the category slugs of a tag in category sort order', async () => {
    const tags = await repository.findAllTags();

    expect(
      tags.find((tag) => tag.slug === `${prefix}-both`)?.categories,
    ).toEqual([`${prefix}-first`, `${prefix}-second`]);
  });

  it('returns an empty list for a tag without a category', async () => {
    const tags = await repository.findAllTags();

    expect(
      tags.find((tag) => tag.slug === `${prefix}-none`)?.categories,
    ).toEqual([]);
  });
});
