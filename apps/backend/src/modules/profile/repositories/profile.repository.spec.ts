import { PrismaService } from '@/core/prisma/prisma.service';
import {
  MeetingFrequency,
  ProfileEntity,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { BadRequestException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;
  let prisma: {
    profile: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let txMock: {
    city: { findUnique: jest.Mock };
    tag: { findMany: jest.Mock };
    profile: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    profileTag: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
  };

  beforeEach(() => {
    txMock = {
      city: { findUnique: jest.fn() },
      tag: { findMany: jest.fn() },
      profile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      profileTag: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    prisma = {
      profile: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(txMock)),
    };

    repository = new ProfileRepository(prisma as unknown as PrismaService);
  });

  describe('findByUserId', () => {
    it('returns null when profile does not exist', async (): Promise<void> => {
      prisma.profile.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('u1');

      expect(result).toBeNull();
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: {
          city: true,
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    it('returns mapped ProfileEntity with parsed expectations and tags', async (): Promise<void> => {
      const dbProfile = {
        userId: 'u1',
        position: 'Engineer',
        roles: ['software-engineer'],
        expectations: JSON.stringify(['learn_new', 'meet_people']),
        meetingFrequency: 'WEEKLY',
        weekdays: true,
        weekends: false,
        mornings: true,
        afternoons: false,
        evenings: false,
        cityId: 'c1',
        city: { id: 'c1', name: 'Praha' },
        radiusKm: 25,
        note: 'Note',
        onboardingCompletedAt: new Date('2026-10-21T10:00:00Z'),
        latitude: 50.08,
        longitude: 14.43,
        tags: [
          {
            tagId: 1,
            kind: 'TEACH',
            tag: { id: 1, slug: 'python' },
          },
          {
            tagId: 2,
            kind: 'LEARN',
            tag: { id: 2, slug: 'sql' },
          },
          {
            tagId: 3,
            kind: 'INTEREST',
            tag: { id: 3, slug: 'hiking' },
          },
        ],
      };

      prisma.profile.findUnique.mockResolvedValue(dbProfile);

      const result = await repository.findByUserId('u1');

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result?.userId).toBe('u1');
      expect(result?.position).toBe('Engineer');
      expect(result?.roles).toEqual(['software-engineer']);
      expect(result?.expectations).toEqual(['learn_new', 'meet_people']);
      expect(result?.meetingFrequency).toBe(MeetingFrequency.WEEKLY);
      expect(result?.cityName).toBe('Praha');
      expect(result?.tags).toHaveLength(3);
      expect(result?.tags[0]).toEqual({
        tagId: '1',
        slug: 'python',
        kind: TagKind.TEACH,
      });
    });

    it('handles expectations JSON parse fallback when string is not valid JSON', async (): Promise<void> => {
      const dbProfile = {
        userId: 'u1',
        position: 'Designer',
        roles: [],
        expectations: 'plain text expectation',
        meetingFrequency: null,
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: null,
        city: null,
        radiusKm: null,
        note: null,
        onboardingCompletedAt: null,
        latitude: null,
        longitude: null,
        tags: [],
      };

      prisma.profile.findUnique.mockResolvedValue(dbProfile);

      const result = await repository.findByUserId('u1');

      expect(result?.expectations).toEqual(['plain text expectation']);
      // Fallback: roles is empty array, falls back to [position]
      expect(result?.roles).toEqual(['Designer']);
    });

    it('handles roles fallback to empty array when neither roles nor position exist', async (): Promise<void> => {
      const dbProfile = {
        userId: 'u1',
        position: null,
        roles: null,
        expectations: null,
        meetingFrequency: null,
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        cityId: null,
        city: null,
        radiusKm: null,
        note: null,
        onboardingCompletedAt: null,
        latitude: null,
        longitude: null,
        tags: [],
      };

      prisma.profile.findUnique.mockResolvedValue(dbProfile);

      const result = await repository.findByUserId('u1');

      expect(result?.roles).toEqual([]);
      expect(result?.expectations).toEqual([]);
    });
  });

  describe('saveProfile', () => {
    const validData = {
      roles: ['frontend-dev', 'designer'],
      teachTagIds: ['1'],
      learnTagIds: ['2'],
      interestTagIds: ['3'],
      weekdays: true,
      weekends: false,
      mornings: true,
      afternoons: false,
      evenings: false,
      cityId: 'c1',
      radiusKm: 15,
      latitude: 50.1,
      longitude: 14.5,
      expectations: ['learn_new'],
      meetingFrequency: MeetingFrequency.WEEKLY,
      note: 'Hello',
      completeOnboarding: true,
    };

    it('validates cityId and throws BadRequestException with CITY_NOT_FOUND if city does not exist', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue(null);

      try {
        await repository.saveProfile('u1', validData);
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toEqual(
          expect.objectContaining({ code: 'CITY_NOT_FOUND' }),
        );
      }
      expect(txMock.city.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(txMock.profile.upsert).not.toHaveBeenCalled();
    });

    it('validates tagIds and throws BadRequestException with TAGS_NOT_FOUND if any tag does not exist', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });
      // Only id 1 and id 2 exist, but id 3 is missing
      txMock.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      try {
        await repository.saveProfile('u1', validData);
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toEqual(
          expect.objectContaining({ code: 'TAGS_NOT_FOUND' }),
        );
      }
      expect(txMock.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        select: { id: true },
      });
      expect(txMock.profile.upsert).not.toHaveBeenCalled();
    });

    it('strictly resolves tags by numeric id without slug fallback', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });
      txMock.tag.findMany.mockResolvedValue([{ id: 1 }]);

      // If id 999 is queried, it searches strictly by numeric id in tx.tag.findMany
      try {
        await repository.saveProfile('u1', {
          ...validData,
          teachTagIds: ['999'],
          learnTagIds: [],
          interestTagIds: [],
        });
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toEqual(
          expect.objectContaining({ code: 'TAGS_NOT_FOUND' }),
        );
      }

      expect(txMock.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: [999] } },
        select: { id: true },
      });
    });

    it('throws TAGS_NOT_FOUND without querying database when tag id overflows integer bounds', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });

      try {
        await repository.saveProfile('u1', {
          ...validData,
          teachTagIds: ['99999999999'],
          learnTagIds: [],
          interestTagIds: [],
        });
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toEqual(
          expect.objectContaining({ code: 'TAGS_NOT_FOUND' }),
        );
      }

      expect(txMock.tag.findMany).not.toHaveBeenCalled();
    });

    it('saves profile, replaces tags, and sets onboardingCompletedAt when onboarding complete', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });
      txMock.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      txMock.profile.findUnique.mockResolvedValue(null); // No existing profile
      txMock.profile.upsert.mockResolvedValue({});
      txMock.profileTag.deleteMany.mockResolvedValue({});
      txMock.profileTag.createMany.mockResolvedValue({});

      // Mock the final findByUserId call
      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue(
          new ProfileEntity(
            'u1',
            'frontend-dev',
            ['learn_new'],
            MeetingFrequency.WEEKLY,
            true,
            false,
            true,
            false,
            false,
            'c1',
            'Praha',
            15,
            'Hello',
            new Date(),
            [],
            ['frontend-dev', 'designer'],
            50.1,
            14.5,
          ),
        );

      const result = await repository.saveProfile('u1', validData);

      expect(txMock.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          create: expect.objectContaining({
            userId: 'u1',
            position: 'frontend-dev',
            roles: ['frontend-dev', 'designer'],
            onboardingCompletedAt: expect.any(Date),
          }),
        }),
      );

      expect(txMock.profileTag.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(txMock.profileTag.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'u1', tagId: 1, kind: TagKind.TEACH },
          { userId: 'u1', tagId: 2, kind: TagKind.LEARN },
          { userId: 'u1', tagId: 3, kind: TagKind.INTEREST },
        ],
        skipDuplicates: true,
      });
      expect(result.userId).toBe('u1');
    });

    it('preserves existing onboardingCompletedAt timestamp if already completed', async (): Promise<void> => {
      const existingDate = new Date('2026-10-01T12:00:00Z');
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });
      txMock.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      txMock.profile.findUnique.mockResolvedValue({
        onboardingCompletedAt: existingDate,
      });

      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue({} as ProfileEntity);

      await repository.saveProfile('u1', validData);

      expect(txMock.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            onboardingCompletedAt: existingDate,
          }),
        }),
      );
    });

    it('does not set onboardingCompletedAt when completeOnboarding is false', async (): Promise<void> => {
      txMock.profile.findUnique.mockResolvedValue(null);
      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue({} as ProfileEntity);

      await repository.saveProfile('u1', {
        ...validData,
        cityId: null,
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        completeOnboarding: false,
      });

      expect(txMock.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            onboardingCompletedAt: null,
          }),
        }),
      );
    });

    it('falls back to position when roles array is empty or undefined', async (): Promise<void> => {
      txMock.profile.findUnique.mockResolvedValue(null);
      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue({} as ProfileEntity);

      await repository.saveProfile('u1', {
        ...validData,
        roles: [],
        position: 'Architect',
        cityId: null,
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        completeOnboarding: false,
      });

      expect(txMock.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            position: 'Architect',
            roles: ['Architect'],
          }),
        }),
      );
    });

    it('partial save keeps existing values by omitting undefined optional fields from update', async (): Promise<void> => {
      txMock.city.findUnique.mockResolvedValue({ id: 'c1', name: 'Praha' });
      txMock.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      txMock.profile.findUnique.mockResolvedValue({
        onboardingCompletedAt: new Date(),
      });
      txMock.profile.upsert.mockResolvedValue({});
      txMock.profileTag.deleteMany.mockResolvedValue({});
      txMock.profileTag.createMany.mockResolvedValue({});

      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue({} as ProfileEntity);

      await repository.saveProfile('u1', {
        ...validData,
        expectations: undefined,
        meetingFrequency: undefined,
        note: undefined,
      });

      const upsertCall = txMock.profile.upsert.mock.calls[0][0];
      expect(upsertCall.update).not.toHaveProperty('expectations');
      expect(upsertCall.update).not.toHaveProperty('meetingFrequency');
      expect(upsertCall.update).not.toHaveProperty('note');
    });

    it('stores null position when neither roles nor position is provided', async (): Promise<void> => {
      txMock.profile.findUnique.mockResolvedValue(null);
      jest
        .spyOn(repository, 'findByUserId')
        .mockResolvedValue({} as ProfileEntity);

      await repository.saveProfile('u1', {
        ...validData,
        roles: [],
        position: undefined,
        cityId: null,
        teachTagIds: [],
        learnTagIds: [],
        interestTagIds: [],
        completeOnboarding: false,
      });

      expect(txMock.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            position: null,
            roles: [],
          }),
          update: expect.objectContaining({
            position: null,
            roles: [],
          }),
        }),
      );
    });
  });
});
