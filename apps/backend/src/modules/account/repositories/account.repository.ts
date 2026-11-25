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

      // 3. Remove what refers to the user without a foreign key (story #179). better-auth keeps
      // pending verifications under the e-mail address (identifier) or the user id (value), so
      // without this a deleted account would still be found by its address.
      const { email } = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true },
      });
      await tx.verification.deleteMany({
        where: {
          OR: [
            { value: userId },
            { identifier: { equals: email, mode: 'insensitive' } },
            // Plugins store a prefixed form (e.g. `email-verification-otp-<email>`). Only a delimiter
            // plus the whole address matches, so `a@x.cz` never matches `ba@x.cz`.
            { identifier: { endsWith: `-${email}`, mode: 'insensitive' } },
            { identifier: { endsWith: `:${email}`, mode: 'insensitive' } },
          ],
        },
      });

      // 4. Delete user row (cascades profile, sessions, accounts; chat messages and matching
      // data lose their author and stay as anonymous history)
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
