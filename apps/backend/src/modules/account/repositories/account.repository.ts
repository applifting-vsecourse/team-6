import { PrismaService } from '@/core/prisma/prisma.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AccountRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kvintetRepository: KvintetRepository,
  ) {}

  // Everything held about one person (Art. 15 and 20). Tokens and password hashes are left out.
  async exportData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        codeOfConductAcceptedAt: true,
        codeOfConductVersion: true,
        sessions: {
          select: {
            createdAt: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
          },
        },
        profile: {
          omit: { userId: true },
          include: {
            city: { select: { name: true } },
            tags: { select: { kind: true, tag: { select: { slug: true } } } },
          },
        },
        kvintetMember: {
          select: { kvintetId: true, joinedAt: true, lastReadMessageId: true },
        },
        messages: {
          where: { kind: 'USER' },
          select: { kvintetId: true, body: true, createdAt: true },
          orderBy: { id: 'asc' },
        },
        feedSnapshots: {
          select: { createdAt: true, fallback: true, items: true },
          orderBy: { id: 'asc' },
        },
        membershipLogs: {
          select: {
            kvintetId: true,
            source: true,
            joinedAt: true,
            leftAt: true,
            position: true,
            listSize: true,
            score: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'not_found',
        message: 'User not found',
      });
    }
    return { exportedAt: new Date(), ...user };
  }

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
