import {
  FeedItem,
  KVINTET_CAPACITY,
  NewKvintet,
} from '@/modules/kvintet/domain/kvintet';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { ValidationFailedException } from '@/shared/errors/validation.pipe';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const alreadyInKvintet = (): ConflictException =>
  new ConflictException({
    code: 'already_in_kvintet',
    message: 'The user is already in a kvintet',
  });

@Injectable()
export class KvintetService {
  constructor(private readonly repository: KvintetRepository) {}

  async membership(userId: string): Promise<{ isMember: boolean }> {
    return { isMember: await this.repository.isMember(userId) };
  }

  async feed(userId: string, categorySlug?: string): Promise<FeedItem[]> {
    // The feed never lists the caller's own kvintet; the client sends them elsewhere.
    if (await this.repository.isMember(userId)) throw alreadyInKvintet();

    // An unknown slug is a client error, not an empty feed.
    if (categorySlug && !(await this.repository.categoryExists(categorySlug))) {
      throw new ValidationFailedException([
        { field: 'category', code: 'isIn' },
      ]);
    }

    const kvintets = await this.repository.findOpenKvintets(categorySlug);
    return kvintets.map((kvintet) => {
      const frequencies = new Set(
        kvintet.members.map((member) => member.meetingFrequency),
      );
      return {
        id: kvintet.id,
        title: kvintet.title,
        category: kvintet.category,
        capacity: KVINTET_CAPACITY,
        memberCount: kvintet.members.length,
        // Only when every member agrees; null otherwise.
        meetingFrequency: frequencies.size === 1 ? [...frequencies][0] : null,
        members: kvintet.members.map((member) => ({
          position: member.position,
          teach: member.teach,
          learn: member.learn,
          interests: member.interests,
        })),
      };
    });
  }

  async start(userId: string, kvintet: NewKvintet): Promise<{ id: string }> {
    const outcome = await this.repository.start(userId, kvintet);
    if (outcome.result === 'unknown_category') {
      throw new ValidationFailedException([
        { field: 'categorySlug', code: 'isIn' },
      ]);
    }
    if (outcome.result === 'already_member') throw alreadyInKvintet();
    return { id: outcome.id };
  }

  async join(userId: string, kvintetId: string): Promise<void> {
    const outcome = await this.repository.join(userId, kvintetId);
    if (outcome === 'not_found') throw new NotFoundException();
    if (outcome === 'already_member') throw alreadyInKvintet();
    if (outcome === 'not_open') {
      throw new ConflictException({
        code: 'kvintet_not_open',
        message: 'The kvintet is full or no longer open',
      });
    }
  }
}
