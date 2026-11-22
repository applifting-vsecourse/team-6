import { PrismaService } from '@/core/prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { sessionPurgeDatabaseHooks } from './session-purge.hook';

describe('sessionPurgeDatabaseHooks', () => {
  const prisma = mockDeep<PrismaService>();
  const after = sessionPurgeDatabaseHooks(prisma).session!.create!
    .after as () => Promise<void>;

  it('deletes sessions that expired before now after a new session is created', async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 2 });

    await after();

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });

  it('does not fail the sign-in when the clean-up fails', async () => {
    prisma.session.deleteMany.mockRejectedValue(new Error('db down'));

    await expect(after()).resolves.toBeUndefined();
  });
});
