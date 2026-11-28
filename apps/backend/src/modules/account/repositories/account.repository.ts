import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
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
      // Exact identifiers only: the bare address and the forms better-auth's emailOTP plugin builds
      // (`<type>-otp-<email>`). A suffix match would catch `foo-a@x.cz` when `a@x.cz` is deleted.
      const identifiers = [
        email,
        ...['email-verification', 'sign-in', 'forget-password'].map(
          (type) => `${type}-otp-${email}`,
        ),
      ].map((identifier) => identifier.toLowerCase());
      // The change-email OTP is keyed by user id: `change-email-otp-<userId>:<newEmail>`.
      const changeEmailPrefix = `change-email-otp-${userId}:`;
      // Raw SQL on purpose: Prisma's `mode: 'insensitive'` compares with ILIKE, where `_` in an
      // address is a wildcard and would match other people's rows.
      await tx.$executeRaw`
        DELETE FROM "verification"
        WHERE "value" = ${userId}
          OR lower("identifier") IN (${Prisma.join(identifiers)})
          OR starts_with("identifier", ${changeEmailPrefix})`;

      // 4. Delete user row (cascades profile, sessions, accounts; chat messages and matching
      // data lose their author and stay as anonymous history)
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
