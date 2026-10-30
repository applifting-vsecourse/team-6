import { KvintetDetails, OpenKvintet } from '@/modules/kvintet/domain/kvintet';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { ValidationFailedException } from '@/shared/errors/validation.pipe';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { mock, type MockProxy } from 'jest-mock-extended';

const member = (
  meetingFrequency: OpenKvintet['members'][number]['meetingFrequency'],
): OpenKvintet['members'][number] => ({
  position: 'Backend developer',
  meetingFrequency,
  teach: ['python'],
  learn: ['ux-design'],
  interests: ['startups'],
});

const kvintet = (members: OpenKvintet['members']): OpenKvintet => ({
  id: 'kvintet-1',
  title: 'Using AI at work',
  categories: ['technology'],
  members,
});

const setup = (): {
  repository: MockProxy<KvintetRepository>;
  service: KvintetService;
} => {
  const repository = mock<KvintetRepository>();
  return { repository, service: new KvintetService(repository) };
};

const conflictCode = (error: unknown): unknown =>
  (error as ConflictException).getResponse() &&
  ((error as ConflictException).getResponse() as { code: string }).code;

describe('KvintetService.membership', () => {
  it.each([true, false])(
    'reports isMember=%s from the repository',
    async (isMember) => {
      const { repository, service } = setup();
      repository.isMember.mockResolvedValue(isMember);

      await expect(service.membership('u1')).resolves.toEqual({ isMember });
    },
  );
});

describe('KvintetService.feed', () => {
  it('answers 409 already_in_kvintet when the caller already has a kvintet', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(true);

    const error = await service.feed('u1').catch((e) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect(conflictCode(error)).toBe('already_in_kvintet');
    expect(repository.findOpenKvintets).not.toHaveBeenCalled();
  });

  it('passes a known category on to the repository', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(false);
    repository.categoryExists.mockResolvedValue(true);
    repository.findOpenKvintets.mockResolvedValue([]);

    await expect(service.feed('u1', 'languages')).resolves.toEqual([]);

    expect(repository.categoryExists).toHaveBeenCalledWith('languages');
    expect(repository.findOpenKvintets).toHaveBeenCalledWith('languages');
  });

  it('rejects an unknown category as a validation error on category', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(false);
    repository.categoryExists.mockResolvedValue(false);

    const error = await service.feed('u1', 'nope').catch((e) => e);

    expect(error).toBeInstanceOf(ValidationFailedException);
    expect(repository.findOpenKvintets).not.toHaveBeenCalled();
  });

  it('does not look the category up when none is given', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(false);
    repository.findOpenKvintets.mockResolvedValue([]);

    await service.feed('u1');

    expect(repository.categoryExists).not.toHaveBeenCalled();
    expect(repository.findOpenKvintets).toHaveBeenCalledWith(undefined);
  });

  it('reports a meeting frequency only when every member agrees', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(false);
    repository.findOpenKvintets.mockResolvedValue([
      kvintet([member('BIWEEKLY'), member('BIWEEKLY')]),
      kvintet([member('BIWEEKLY'), member('WEEKLY')]),
      kvintet([member('BIWEEKLY'), member(null)]),
      kvintet([member(null)]),
    ]);

    const feed = await service.feed('u1');

    expect(feed.map((item) => item.meetingFrequency)).toEqual([
      'BIWEEKLY',
      null,
      null,
      null,
    ]);
  });

  it('counts the members and sends only role and tags for each', async () => {
    const { repository, service } = setup();
    repository.isMember.mockResolvedValue(false);
    // A leaked field on the domain object must not reach the response.
    const leaky = { ...member('WEEKLY'), name: 'Jana', userId: 'u2' };
    repository.findOpenKvintets.mockResolvedValue([kvintet([leaky])]);

    const [item] = await service.feed('u1');

    expect(item).toEqual({
      id: 'kvintet-1',
      title: 'Using AI at work',
      categories: ['technology'],
      capacity: 5,
      memberCount: 1,
      meetingFrequency: 'WEEKLY',
      members: [
        {
          position: 'Backend developer',
          teach: ['python'],
          learn: ['ux-design'],
          interests: ['startups'],
        },
      ],
    });
  });
});

describe('KvintetService.start', () => {
  const input = { title: 'Topic', categorySlugs: ['leisure'], description: null };

  it('returns the new kvintet id', async () => {
    const { repository, service } = setup();
    repository.start.mockResolvedValue({ result: 'started', id: 'k1' });

    await expect(service.start('u1', input)).resolves.toEqual({ id: 'k1' });
  });

  it('rejects an unknown category as a validation error on categorySlugs', async () => {
    const { repository, service } = setup();
    repository.start.mockResolvedValue({ result: 'unknown_category' });

    const error = await service.start('u1', input).catch((e) => e);

    expect(error).toBeInstanceOf(ValidationFailedException);
    expect(error.errors).toEqual([{ field: 'categorySlugs', code: 'isIn' }]);
  });

  it('answers 409 already_in_kvintet when the caller already has a kvintet', async () => {
    const { repository, service } = setup();
    repository.start.mockResolvedValue({ result: 'already_member' });

    const error = await service.start('u1', input).catch((e) => e);

    expect(conflictCode(error)).toBe('already_in_kvintet');
  });
});

describe('KvintetService.join', () => {
  it('resolves when the caller joined', async () => {
    const { repository, service } = setup();
    repository.join.mockResolvedValue('joined');

    await expect(service.join('u1', 'k1')).resolves.toBeUndefined();
  });

  it('answers 404 when the kvintet is gone', async () => {
    const { repository, service } = setup();
    repository.join.mockResolvedValue('not_found');

    await expect(service.join('u1', 'k1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([
    ['not_open', 'kvintet_not_open'],
    ['already_member', 'already_in_kvintet'],
  ] as const)('answers 409 %s with its own code', async (outcome, code) => {
    const { repository, service } = setup();
    repository.join.mockResolvedValue(outcome);

    const error = await service.join('u1', 'k1').catch((e) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect(conflictCode(error)).toBe(code);
  });
});

describe('KvintetService.getMyKvintet', () => {
  const mockDetails: KvintetDetails = {
    id: 'k1',
    title: 'AI v práci',
    status: 'FORMING',
    createdAt: new Date('2026-10-21T10:00:00Z'),
    activatedAt: null,
    commonPreferences: {
      city: 'Praha',
      meetingFrequency: 'BIWEEKLY',
      weekdays: true,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: true,
    },
    capacity: 5,
    openSeatsCount: 1,
    members: [
      {
        userId: 'u1',
        name: 'Jana Nováková',
        username: 'jana',
        role: 'Marketingová specialistka',
        teachTags: ['Excel'],
        learnTags: ['Python'],
        interestTags: ['Turistika'],
        hasVoted: false,
        isCurrentUser: true,
      },
    ],
    voteStatus: {
      canVote: true,
      userHasVoted: false,
      votedCount: 3,
      totalCount: 4,
    },
  };

  it('returns kvintet details if caller is a member', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findKvintetDetailsByUserId.mockResolvedValue(mockDetails);

    const result = await service.getMyKvintet('u1');

    expect(result).toEqual(mockDetails);
    expect(repository.findKvintetDetailsByUserId).toHaveBeenCalledWith('u1');
  });

  it('throws 403 Forbidden if caller has no kvintet', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findKvintetDetailsByUserId.mockResolvedValue(null);

    await expect(service.getMyKvintet('u1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('KvintetService.vote', () => {
  const mockDetails: KvintetDetails = {
    id: 'k1',
    title: 'AI v práci',
    status: 'FORMING',
    createdAt: new Date('2026-10-21T10:00:00Z'),
    activatedAt: null,
    commonPreferences: {
      city: 'Praha',
      meetingFrequency: 'BIWEEKLY',
      weekdays: true,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: true,
    },
    capacity: 5,
    openSeatsCount: 1,
    members: [],
    voteStatus: {
      canVote: true,
      userHasVoted: false,
      votedCount: 3,
      totalCount: 4,
    },
  };

  it('casts vote and returns updated details', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findMembership.mockResolvedValue({
      kvintetId: 'k1',
      userId: 'u1',
      joinedAt: new Date(),
      kvintet: {} as never,
    });
    repository.vote.mockResolvedValue(undefined);
    repository.findKvintetDetailsByUserId.mockResolvedValue({
      ...mockDetails,
      voteStatus: {
        ...mockDetails.voteStatus,
        votedCount: 4,
        userHasVoted: true,
      },
    });

    const result = await service.vote('u1');

    expect(repository.vote).toHaveBeenCalledWith('k1', 'u1');
    expect(result.voteStatus.votedCount).toBe(4);
  });

  it('throws 403 Forbidden if user is not in a kvintet', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findMembership.mockResolvedValue(null);

    await expect(service.vote('u1')).rejects.toThrow(ForbiddenException);
  });

  it('throws 404 if kvintet details disappear after vote', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findMembership.mockResolvedValue({
      kvintetId: 'k1',
      userId: 'u1',
      joinedAt: new Date(),
      kvintet: {} as never,
    });
    repository.vote.mockResolvedValue(undefined);
    repository.findKvintetDetailsByUserId.mockResolvedValue(null);

    await expect(service.vote('u1')).rejects.toThrow(NotFoundException);
  });
});

describe('KvintetService.leave', () => {
  it('removes member from kvintet', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findMembership.mockResolvedValue({
      kvintetId: 'k1',
      userId: 'u1',
      joinedAt: new Date(),
      kvintet: {} as never,
    });
    repository.leave.mockResolvedValue(undefined);

    const result = await service.leave('u1');

    expect(repository.leave).toHaveBeenCalledWith('k1', 'u1');
    expect(result).toEqual({ success: true });
  });

  it('throws 403 Forbidden if caller has no kvintet', async (): Promise<void> => {
    const { repository, service } = setup();
    repository.findMembership.mockResolvedValue(null);

    await expect(service.leave('u1')).rejects.toThrow(ForbiddenException);
  });
});
