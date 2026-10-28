import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

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

      // 2. If the user is in a kvintet, lock kvintet and leave cleanly
      const membership = await tx.kvintetMember.findUnique({
        where: { userId },
      });

      if (membership) {
        const lockedKvintet = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "kvintet" WHERE id = ${membership.kvintetId}::uuid FOR UPDATE
        `;

        if (lockedKvintet && lockedKvintet.length > 0) {
          const kvintet = await tx.kvintet.findUnique({
            where: { id: membership.kvintetId },
            include: {
              members: true,
            },
          });

          if (kvintet) {
            const isMember = kvintet.members.some((m) => m.userId === userId);
            if (isMember) {
              await tx.kvintetMember.delete({
                where: {
                  kvintetId_userId: {
                    kvintetId: membership.kvintetId,
                    userId,
                  },
                },
              });

              const remainingMembers = kvintet.members.filter(
                (m) => m.userId !== userId,
              );

              if (remainingMembers.length === 0) {
                await tx.kvintet.delete({
                  where: { id: membership.kvintetId },
                });
              } else if (kvintet.status === 'FORMING') {
                // Votes agreed to the old roster; remaining members must vote again.
                await tx.kvintetVote.deleteMany({
                  where: { kvintetId: membership.kvintetId },
                });
              }
            }
          }
        }
      }

      // 3. Delete user row (cascades profile, sessions, accounts, and anonymises chat messages)
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
