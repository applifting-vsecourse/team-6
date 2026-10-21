import {
  MeetingFrequency,
  ProfileEntity,
  ProfileTagEntity,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: {
    findByUserId: jest.Mock;
    saveProfile: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      saveProfile: jest.fn(),
    };
    service = new ProfileService(repository as unknown as ProfileRepository);
  });

  it('returns null if profile does not exist', async (): Promise<void> => {
    repository.findByUserId.mockResolvedValue(null);

    const result = await service.getProfile('u1');

    expect(result).toBeNull();
    expect(repository.findByUserId).toHaveBeenCalledWith('u1');
  });

  it('returns profile entity from repository', async (): Promise<void> => {
    const entity = new ProfileEntity(
      'u1',
      'Software Engineer',
      ['learn_new'],
      MeetingFrequency.WEEKLY,
      true,
      false,
      false,
      false,
      true,
      'c1',
      'Praha',
      15,
      'English preferred',
      new Date('2026-10-21T12:00:00Z'),
      [
        new ProfileTagEntity('t1', 'python', TagKind.TEACH),
        new ProfileTagEntity('t2', 'sql', TagKind.LEARN),
        new ProfileTagEntity('t3', 'hiking', TagKind.INTEREST),
      ],
    );

    repository.findByUserId.mockResolvedValue(entity);

    const result = await service.getProfile('u1');

    expect(result).toBe(entity);
  });

  it('delegates saveProfile to repository', async (): Promise<void> => {
    const savedEntity = new ProfileEntity(
      'u1',
      'Designer',
      [],
      MeetingFrequency.BIWEEKLY,
      false,
      true,
      true,
      false,
      false,
      'c2',
      'Brno',
      10,
      null,
      new Date('2026-10-21T12:00:00Z'),
      [],
    );

    repository.saveProfile.mockResolvedValue(savedEntity);

    const result = await service.saveProfile('u1', {
      position: 'Designer',
      teachTagIds: [],
      learnTagIds: [],
      interestTagIds: [],
      weekdays: false,
      weekends: true,
      mornings: true,
      afternoons: false,
      evenings: false,
      cityId: 'c2',
      radiusKm: 10,
      meetingFrequency: MeetingFrequency.BIWEEKLY,
      completeOnboarding: true,
    });

    expect(result).toBe(savedEntity);
    expect(repository.saveProfile).toHaveBeenCalledWith('u1', {
      position: 'Designer',
      teachTagIds: [],
      learnTagIds: [],
      interestTagIds: [],
      weekdays: false,
      weekends: true,
      mornings: true,
      afternoons: false,
      evenings: false,
      cityId: 'c2',
      radiusKm: 10,
      expectations: undefined,
      meetingFrequency: MeetingFrequency.BIWEEKLY,
      note: undefined,
      completeOnboarding: true,
    });
  });
});
