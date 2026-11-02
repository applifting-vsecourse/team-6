import {
  Feed,
  FEED_REASONS,
  KVINTET_CAPACITY,
  KvintetDetails,
  NewKvintet,
} from '@/modules/kvintet/domain/kvintet';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { MATCH_THRESHOLD, scoreKvintet } from '@/modules/matching/matching';
import { ValidationFailedException } from '@/shared/errors/validation.pipe';
import {
  ConflictException,
  ForbiddenException,
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

  async feed(userId: string, categorySlug?: string): Promise<Feed> {
    // The feed never lists the caller's own kvintet; the client sends them elsewhere.
    if (await this.repository.isMember(userId)) throw alreadyInKvintet();

    // An unknown slug is a client error, not an empty feed.
    if (categorySlug && !(await this.repository.categoryExists(categorySlug))) {
      throw new ValidationFailedException([
        { field: 'category', code: 'isIn' },
      ]);
    }

    const [me, kvintets] = await Promise.all([
      this.repository.findMatchProfile(userId),
      this.repository.findOpenKvintets(categorySlug),
    ]);

    // Computed on every read: profile changes show on the next load. The repository lists
    // newest first and the sort is stable, so equal scores stay newest first.
    const ranked = kvintets
      .map((kvintet) => ({
        kvintet,
        ...scoreKvintet(me, {
          categories: kvintet.categories,
          members: kvintet.members.map((member) => member.match),
        }),
      }))
      .sort((a, b) => b.score - a.score);
    const matching = ranked.filter((item) => item.score >= MATCH_THRESHOLD);
    // A small pilot must never get an empty feed just because nothing fits well.
    const fallback = matching.length === 0 && ranked.length > 0;

    return {
      fallback,
      items: (fallback ? ranked : matching).map(({ kvintet, reasons }) => {
        const frequencies = new Set(
          kvintet.members.map((member) => member.meetingFrequency),
        );
        return {
          id: kvintet.id,
          title: kvintet.title,
          categories: kvintet.categories,
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
          reasons: reasons.slice(0, FEED_REASONS),
        };
      }),
    };
  }

  async start(userId: string, kvintet: NewKvintet): Promise<{ id: string }> {
    const outcome = await this.repository.start(userId, kvintet);
    if (outcome.result === 'unknown_category') {
      throw new ValidationFailedException([
        { field: 'categorySlugs', code: 'isIn' },
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

  async getMyKvintet(userId: string): Promise<KvintetDetails> {
    const details = await this.repository.findKvintetDetailsByUserId(userId);

    if (!details) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'forbidden',
        message: 'Caller is not a member of any kvintet',
      });
    }

    return details;
  }

  async vote(userId: string): Promise<KvintetDetails> {
    const membership = await this.repository.findMembership(userId);
    if (!membership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'forbidden',
        message: 'Caller is not a member of any kvintet',
      });
    }

    await this.repository.vote(membership.kvintetId, userId);
    const updated = await this.repository.findKvintetDetailsByUserId(userId);

    if (!updated) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'not_found',
        message: 'Kvintet not found after voting',
      });
    }

    return updated;
  }

  async leave(userId: string): Promise<{ success: boolean }> {
    const membership = await this.repository.findMembership(userId);
    if (!membership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'forbidden',
        message: 'Caller is not a member of any kvintet',
      });
    }

    await this.repository.leave(membership.kvintetId, userId);
    return { success: true };
  }
}
