import {
  ChatCursor,
  ChatMessage,
  UnreadState,
} from '@/modules/chat/domain/message';
import { MessageRepository } from '@/modules/chat/repositories/message.repository';
import { ValidationFailedException } from '@/shared/errors/validation.pipe';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const notActive = (): ConflictException =>
  new ConflictException({
    code: 'kvintet_not_active',
    message: 'The kvintet chat opens when the kvintet is active',
  });

const notMember = (): ForbiddenException =>
  new ForbiddenException({
    code: 'forbidden',
    message: 'Caller is not a member of any kvintet',
  });

@Injectable()
export class MessageService {
  constructor(private readonly repository: MessageRepository) {}

  async list(userId: string, cursor: ChatCursor): Promise<ChatMessage[]> {
    if (cursor.after !== undefined && cursor.before !== undefined) {
      throw new ValidationFailedException([
        { field: 'before', code: 'conflictsWithAfter' },
      ]);
    }
    const access = await this.repository.findAccess(userId);
    if (!access) throw notMember();
    if (!access.active) throw notActive();
    return this.repository.list(access.kvintetId, cursor);
  }

  /** A forming kvintet is `active: false`, not an error, so the header can poll this without 409s. */
  async unread(userId: string): Promise<UnreadState> {
    const access = await this.repository.findAccess(userId);
    if (!access) throw notMember();
    if (!access.active) return { active: false, count: 0 };
    return {
      active: true,
      count: await this.repository.countUnread(userId, access.kvintetId),
    };
  }

  async markRead(userId: string, lastMessageId: number): Promise<void> {
    const access = await this.repository.findAccess(userId);
    if (!access) throw notMember();
    if (!access.active) throw notActive();
    await this.repository.markRead(userId, access.kvintetId, lastMessageId);
  }

  async send(userId: string, body: string): Promise<ChatMessage> {
    const access = await this.repository.findAccess(userId);
    if (!access) throw notMember();
    if (!access.active) throw notActive();

    const outcome = await this.repository.send(access.kvintetId, userId, body);
    if (outcome.result === 'not_member') throw notMember();
    if (outcome.result === 'not_active') throw notActive();
    return outcome.message;
  }
}
