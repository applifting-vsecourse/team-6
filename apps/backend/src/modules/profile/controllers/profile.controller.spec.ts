import {
  MeetingFrequency,
  ProfileEntity,
  ProfileTagEntity,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { ProfileService } from '@/modules/profile/services/profile.service';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ProfileController } from './profile.controller';

jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: {
    getProfile: jest.Mock;
    saveProfile: jest.Mock;
  };

  const mockUser: Identity = {
    id: 'u1',
    name: 'Jan Novak',
    email: 'jan@novak.cz',
    role: 'user',
  };

  const createMockResponse = (): Response => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(() => {
    service = {
      getProfile: jest.fn(),
      saveProfile: jest.fn(),
    };
    controller = new ProfileController(service as unknown as ProfileService);
  });

  describe('getProfile', () => {
    it('returns 200 with null when service returns null', async (): Promise<void> => {
      service.getProfile.mockResolvedValue(null);
      const res = createMockResponse();

      await controller.getProfile(mockUser, res);

      expect(service.getProfile).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
    });

    it('returns 200 with partitioned tags and profile response dto when profile exists', async (): Promise<void> => {
      const profile = new ProfileEntity(
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
        10,
        'Note',
        new Date('2026-10-21T10:00:00Z'),
        [
          new ProfileTagEntity('t1', 'excel', TagKind.TEACH),
          new ProfileTagEntity('t2', 'python', TagKind.LEARN),
          new ProfileTagEntity('t3', 'hiking', TagKind.INTEREST),
        ],
        ['Software Engineer'],
        50.07,
        14.43,
      );

      service.getProfile.mockResolvedValue(profile);
      const res = createMockResponse();

      await controller.getProfile(mockUser, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        userId: 'u1',
        position: 'Software Engineer',
        roles: ['Software Engineer'],
        latitude: 50.07,
        longitude: 14.43,
        expectations: ['learn_new'],
        meetingFrequency: MeetingFrequency.WEEKLY,
        weekdays: true,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: true,
        cityId: 'c1',
        cityName: 'Praha',
        radiusKm: 10,
        note: 'Note',
        onboardingCompletedAt: new Date('2026-10-21T10:00:00Z'),
        teaches: [{ id: 't1', slug: 'excel' }],
        learns: [{ id: 't2', slug: 'python' }],
        interests: [{ id: 't3', slug: 'hiking' }],
      });
    });
  });

  describe('saveProfile', () => {
    it('uses roles array and derives position from roles[0]', async (): Promise<void> => {
      const savedProfile = new ProfileEntity(
        'u1',
        'lead-architect',
        [],
        null,
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        null,
        null,
        [],
        ['lead-architect', 'consultant'],
      );
      service.saveProfile.mockResolvedValue(savedProfile);

      const result = await controller.saveProfile(mockUser, {
        roles: ['lead-architect', 'consultant'],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
      });

      expect(service.saveProfile).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          position: 'lead-architect',
          roles: ['lead-architect', 'consultant'],
          completeOnboarding: false,
        }),
      );
      expect(result.roles).toEqual(['lead-architect', 'consultant']);
      expect(result.position).toBe('lead-architect');
    });

    it('falls back to position when roles is not provided or empty', async (): Promise<void> => {
      const savedProfile = new ProfileEntity(
        'u1',
        'Designer',
        [],
        null,
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        null,
        null,
        [],
        ['Designer'],
      );
      service.saveProfile.mockResolvedValue(savedProfile);

      await controller.saveProfile(mockUser, {
        position: 'Designer',
        roles: [],
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
      });

      expect(service.saveProfile).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          position: 'Designer',
          roles: ['Designer'],
        }),
      );
    });

    it('leaves roles and position undefined when neither is provided to preserve existing values', async (): Promise<void> => {
      const savedProfile = new ProfileEntity(
        'u1',
        null,
        [],
        null,
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        null,
        null,
        [],
        [],
      );
      service.saveProfile.mockResolvedValue(savedProfile);

      await controller.saveProfile(mockUser, {
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
      });

      expect(service.saveProfile).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          position: undefined,
          roles: undefined,
        }),
      );
    });

    it('passes completeOnboarding: true to service and propagates validation errors when service rejects incomplete profile', async (): Promise<void> => {
      const validationError = new BadRequestException({
        code: 'PROFILE_ROLE_REQUIRED',
        message: 'At least one role is required to complete onboarding',
      });
      service.saveProfile.mockRejectedValue(validationError);

      await expect(
        controller.saveProfile(mockUser, {
          completeOnboarding: true,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(service.saveProfile).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          completeOnboarding: true,
        }),
      );
    });
  });
});
