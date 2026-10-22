import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveProfileDto } from './save-profile.dto';

describe('SaveProfileDto validation', () => {
  const createValidDto = (): Record<string, unknown> => ({
    roles: ['software-engineer'],
    teachTagIds: ['t1'],
    learnTagIds: ['t2'],
    interestTagIds: ['t3'],
    weekdays: true,
    weekends: false,
    mornings: true,
    afternoons: false,
    evenings: false,
    latitude: 50.08,
    longitude: 14.43,
    radiusKm: 25,
    expectations: ['learn_new'],
    completeOnboarding: true,
  });

  it('validates a correct payload without errors', async (): Promise<void> => {
    const dto = plainToInstance(SaveProfileDto, createValidDto());
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('coordinate validation', () => {
    it('rejects latitude out of range (> 90)', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        latitude: 95.0,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('rejects latitude out of range (< -90)', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        latitude: -91.0,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('rejects latitude NaN', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        latitude: NaN,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('rejects longitude out of range (> 180)', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        longitude: 181.0,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });

    it('rejects longitude out of range (< -180)', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        longitude: -185.0,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });
  });

  describe('array size and item length validation', () => {
    it('rejects roles array with more than 20 items', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        roles: Array.from({ length: 21 }, (_, i) => `role-${i}`),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'roles')).toBe(true);
    });

    it('rejects roles with items exceeding 100 characters', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        roles: ['a'.repeat(101)],
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'roles')).toBe(true);
    });

    it('rejects teachTagIds array exceeding 50 items', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        teachTagIds: Array.from({ length: 51 }, (_, i) => `tag-${i}`),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'teachTagIds')).toBe(true);
    });

    it('rejects expectations array exceeding 20 items', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        expectations: Array.from({ length: 21 }, (_, i) => `exp-${i}`),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'expectations')).toBe(true);
    });

    it('rejects expectations with items exceeding 200 characters', async (): Promise<void> => {
      const dto = plainToInstance(SaveProfileDto, {
        ...createValidDto(),
        expectations: ['x'.repeat(201)],
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'expectations')).toBe(true);
    });
  });
});
