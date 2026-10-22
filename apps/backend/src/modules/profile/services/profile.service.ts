import {
  ProfileEntity,
  SaveProfileData,
} from '@/modules/profile/domain/profile.entity';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileEntity | null> {
    return this.profileRepository.findByUserId(userId);
  }

  async saveProfile(
    userId: string,
    data: SaveProfileData,
  ): Promise<ProfileEntity> {
    const existing = await this.profileRepository.findByUserId(userId);
    const isOnboarded = Boolean(existing?.onboardingCompletedAt);

    if (data.completeOnboarding || isOnboarded) {
      this.validateCompleteProfile(data, existing);
    }
    return this.profileRepository.saveProfile(userId, data);
  }

  private validateCompleteProfile(
    data: SaveProfileData,
    existing?: ProfileEntity | null,
  ): void {
    const effectiveRoles =
      data.roles !== undefined ? data.roles : (existing?.roles ?? []);
    const effectivePosition =
      data.position !== undefined
        ? data.position
        : (existing?.position ?? null);
    const hasRole =
      (effectiveRoles &&
        effectiveRoles.length > 0 &&
        effectiveRoles.some((r) => r.trim().length > 0)) ||
      Boolean(effectivePosition?.trim());
    if (!hasRole) {
      throw new BadRequestException({
        code: 'PROFILE_ROLE_REQUIRED',
        message: 'At least one role is required to complete onboarding',
      });
    }

    const effectiveLat =
      data.latitude !== undefined ? data.latitude : existing?.latitude;
    const effectiveLng =
      data.longitude !== undefined ? data.longitude : existing?.longitude;
    const effectiveCityId =
      data.cityId !== undefined ? data.cityId : existing?.cityId;
    const hasLocation =
      (effectiveLat != null && effectiveLng != null) ||
      Boolean(effectiveCityId);
    if (!hasLocation) {
      throw new BadRequestException({
        code: 'PROFILE_LOCATION_REQUIRED',
        message:
          'Location coordinates or city is required to complete onboarding',
      });
    }

    const effectiveWeekdays =
      data.weekdays !== undefined ? data.weekdays : existing?.weekdays;
    const effectiveWeekends =
      data.weekends !== undefined ? data.weekends : existing?.weekends;
    const effectiveMornings =
      data.mornings !== undefined ? data.mornings : existing?.mornings;
    const effectiveAfternoons =
      data.afternoons !== undefined ? data.afternoons : existing?.afternoons;
    const effectiveEvenings =
      data.evenings !== undefined ? data.evenings : existing?.evenings;
    const hasAvailability = Boolean(
      effectiveWeekdays ||
      effectiveWeekends ||
      effectiveMornings ||
      effectiveAfternoons ||
      effectiveEvenings,
    );
    if (!hasAvailability) {
      throw new BadRequestException({
        code: 'PROFILE_AVAILABILITY_REQUIRED',
        message:
          'At least one availability slot is required to complete onboarding',
      });
    }

    const effectiveFrequency =
      data.meetingFrequency !== undefined
        ? data.meetingFrequency
        : existing?.meetingFrequency;
    if (!effectiveFrequency) {
      throw new BadRequestException({
        code: 'PROFILE_FREQUENCY_REQUIRED',
        message: 'Meeting frequency is required to complete onboarding',
      });
    }
  }
}
