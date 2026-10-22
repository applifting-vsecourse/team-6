import {
  MeetingFrequency,
  ProfileEntity,
  ProfileTagEntity,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { BadRequestException } from '@nestjs/common';
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

  it('allows saving partial profile when completeOnboarding is false for un-onboarded user', async (): Promise<void> => {
    repository.findByUserId.mockResolvedValue(null);
    repository.saveProfile.mockResolvedValue({} as ProfileEntity);

    await service.saveProfile('u1', {
      position: '',
      roles: [],
      teachTagIds: [],
      learnTagIds: [],
      interestTagIds: [],
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false,
      cityId: null,
      radiusKm: null,
      completeOnboarding: false,
    });

    expect(repository.saveProfile).toHaveBeenCalled();
  });

  it('throws BadRequestException when already-onboarded user saves incomplete profile with completeOnboarding false', async (): Promise<void> => {
    const existingOnboarded = new ProfileEntity(
      'u1',
      'Engineer',
      null,
      null,
      true,
      false,
      false,
      false,
      false,
      'c1',
      'Praha',
      25,
      null,
      new Date('2026-10-21T12:00:00Z'),
      [],
    );
    repository.findByUserId.mockResolvedValue(existingOnboarded);

    await expect(
      service.saveProfile('u1', {
        position: '',
        roles: [],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: null,
        radiusKm: null,
        completeOnboarding: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows already-onboarded user to update profile when required fields are preserved', async (): Promise<void> => {
    const existingOnboarded = new ProfileEntity(
      'u1',
      'Engineer',
      null,
      MeetingFrequency.WEEKLY,
      true,
      false,
      false,
      false,
      false,
      'c1',
      'Praha',
      25,
      null,
      new Date('2026-10-21T12:00:00Z'),
      [],
    );
    repository.findByUserId.mockResolvedValue(existingOnboarded);
    const updatedEntity = {} as ProfileEntity;
    repository.saveProfile.mockResolvedValue(updatedEntity);

    const result = await service.saveProfile('u1', {
      position: 'Senior Engineer',
      roles: ['software-engineer'],
      teachTagIds: [],
      learnTagIds: [],
      interestTagIds: [],
      weekdays: true,
      weekends: false,
      mornings: true,
      afternoons: false,
      evenings: false,
      cityId: 'c1',
      radiusKm: 25,
      completeOnboarding: false,
    });

    expect(result).toBe(updatedEntity);
    expect(repository.saveProfile).toHaveBeenCalled();
  });

  it('throws BadRequestException when completing onboarding without roles', async (): Promise<void> => {
    try {
      await service.saveProfile('u1', {
        position: '',
        roles: [],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: true,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: 'c1',
        radiusKm: 10,
        completeOnboarding: true,
      });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'PROFILE_ROLE_REQUIRED' }),
      );
    }
  });

  it('throws BadRequestException when completing onboarding without location', async (): Promise<void> => {
    try {
      await service.saveProfile('u1', {
        position: 'Engineer',
        roles: ['software-engineer'],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: true,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: null,
        latitude: null,
        longitude: null,
        completeOnboarding: true,
      });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'PROFILE_LOCATION_REQUIRED' }),
      );
    }
  });

  it('throws BadRequestException when completing onboarding without any availability slot', async (): Promise<void> => {
    try {
      await service.saveProfile('u1', {
        position: 'Engineer',
        roles: ['software-engineer'],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: 'c1',
        completeOnboarding: true,
      });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'PROFILE_AVAILABILITY_REQUIRED' }),
      );
    }
  });

  it('throws BadRequestException when completing onboarding without meeting frequency', async (): Promise<void> => {
    try {
      await service.saveProfile('u1', {
        position: 'Engineer',
        roles: ['software-engineer'],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: true,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: 'c1',
        completeOnboarding: true,
      });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({ code: 'PROFILE_FREQUENCY_REQUIRED' }),
      );
    }
  });
});
