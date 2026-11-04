import { PrismaService } from '@/core/prisma/prisma.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AccountRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kvintetRepository: KvintetRepository,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Lock user row to verify existence and prevent concurrent operations
      const lockedUser = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE
      `;

      if (!lockedUser || lockedUser.length === 0) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'User not found',
        });
      }

      // 2. If the user is in a kvintet, leave it cleanly via kvintetRepository
      const membership = await tx.kvintetMember.findUnique({
        where: { userId },
      });

      if (membership) {
        await this.kvintetRepository.leaveInTransaction(
          tx,
          membership.kvintetId,
          userId,
          { silentIfNotMember: true },
        );
      }

      // 3. Delete user row (cascades profile, sessions, accounts, and anonymises chat messages)
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
