import { PrismaService } from '@/core/prisma/prisma.service';
import type { KvintetStatus } from '@/generated/prisma/client';
import {
  ChatAccess,
  ChatCursor,
  ChatMessage,
  MESSAGE_PAGE_SIZE,
  MESSAGE_POLL_LIMIT,
  SendOutcome,
} from '@/modules/chat/domain/message';
import { Injectable } from '@nestjs/common';

const withAuthor = {
  id: true,
  kind: true,
  authorId: true,
  body: true,
  createdAt: true,
  author: { select: { name: true, username: true } },
} as const;

type MessageRow = {
  id: number;
  kind: ChatMessage['kind'];
  authorId: string | null;
  body: string;
  createdAt: Date;
  author: { name: string; username: string | null } | null;
};

const toMessage = (row: MessageRow): ChatMessage => ({
  id: row.id,
  kind: row.kind,
  authorId: row.authorId,
  authorName: row.author?.name ?? null,
  authorUsername: row.author?.username ?? null,
  body: row.body,
  createdAt: row.createdAt,
});

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAccess(userId: string): Promise<ChatAccess> {
    const member = await this.prisma.kvintetMember.findUnique({
      where: { userId },
      select: { kvintet: { select: { id: true, status: true } } },
    });
    return member
      ? {
          kvintetId: member.kvintet.id,
          active: member.kvintet.status === 'ACTIVE',
        }
      : null;
  }

  /** Oldest to newest. `after` pages forward, `before` pages back, neither gives the latest page. */
  async list(
    kvintetId: string,
    { after, before }: ChatCursor,
  ): Promise<ChatMessage[]> {
    const forward = after !== undefined;
    const rows = await this.prisma.message.findMany({
      where: {
        kvintetId,
        ...(forward ? { id: { gt: after } } : {}),
        ...(before !== undefined ? { id: { lt: before } } : {}),
      },
      orderBy: { id: forward ? 'asc' : 'desc' },
      take: forward ? MESSAGE_POLL_LIMIT : MESSAGE_PAGE_SIZE,
      select: withAuthor,
    });
    return (forward ? rows : rows.reverse()).map(toMessage);
  }

  /** Messages from other members (and from deleted accounts) after the caller's read mark. */
  async countUnread(userId: string, kvintetId: string): Promise<number> {
    const member = await this.prisma.kvintetMember.findUnique({
      where: { userId },
      select: { lastReadMessageId: true },
    });
    if (!member) return 0;
    return this.prisma.message.count({
      where: {
        kvintetId,
        kind: 'USER',
        id: { gt: member.lastReadMessageId },
        // `not` alone would drop NULL authors, i.e. members who deleted their account.
        OR: [{ authorId: null }, { authorId: { not: userId } }],
      },
    });
  }

  /**
   * Moves the caller's read mark up to `lastMessageId`, never backwards and never past the
   * newest message, so a made-up id cannot hide messages that are yet to come. Matching no row
   * (the caller just left) is fine: there is nothing left to mark.
   */
  async markRead(
    userId: string,
    kvintetId: string,
    lastMessageId: number,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "kvintet_member"
      SET "lastReadMessageId" = GREATEST(
        "lastReadMessageId",
        LEAST(
          ${lastMessageId}::int,
          COALESCE((SELECT MAX("id") FROM "message" WHERE "kvintetId" = ${kvintetId}::uuid), 0)
        )
      )
      WHERE "userId" = ${userId} AND "kvintetId" = ${kvintetId}::uuid`;
  }

  /**
   * Locks the kvintet row, then re-checks membership and status: the guard alone is
   * not enough because a concurrent Leave can pass it. The lock also makes ids commit
   * in order per kvintet, so a poll can never skip a message.
   */
  async send(
    kvintetId: string,
    userId: string,
    body: string,
  ): Promise<SendOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ status: KvintetStatus }[]>`
        SELECT "status" FROM "kvintet" WHERE "id" = ${kvintetId}::uuid FOR UPDATE`;
      if (rows.length === 0) return { result: 'not_member' };

      const member = await tx.kvintetMember.findUnique({
        where: { userId },
        select: { kvintetId: true },
      });
      if (member?.kvintetId !== kvintetId) return { result: 'not_member' };
      if (rows[0].status !== 'ACTIVE') return { result: 'not_active' };

      const row = await tx.message.create({
        data: { kvintetId, authorId: userId, kind: 'USER', body },
        select: withAuthor,
      });
      return { result: 'sent', message: toMessage(row) };
    });
  }
}
