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
    const hasRole =
      (data.roles &&
        data.roles.length > 0 &&
        data.roles.some((r) => r.trim().length > 0)) ||
      Boolean(data.position?.trim()) ||
      Boolean(existing?.roles?.length) ||
      Boolean(existing?.position?.trim());
    if (!hasRole) {
      throw new BadRequestException({
        code: 'PROFILE_ROLE_REQUIRED',
        message: 'At least one role is required to complete onboarding',
      });
    }

    const hasLocation =
      (data.latitude != null && data.longitude != null) ||
      Boolean(data.cityId) ||
      (existing?.latitude != null && existing?.longitude != null) ||
      Boolean(existing?.cityId);
    if (!hasLocation) {
      throw new BadRequestException({
        code: 'PROFILE_LOCATION_REQUIRED',
        message:
          'Location coordinates or city is required to complete onboarding',
      });
    }

    const hasAvailability =
      data.weekdays ||
      data.weekends ||
      data.mornings ||
      data.afternoons ||
      data.evenings ||
      existing?.weekdays ||
      existing?.weekends ||
      existing?.mornings ||
      existing?.afternoons ||
      existing?.evenings;
    if (!hasAvailability) {
      throw new BadRequestException({
        code: 'PROFILE_AVAILABILITY_REQUIRED',
        message:
          'At least one availability slot is required to complete onboarding',
      });
    }

    const hasFrequency = Boolean(
      data.meetingFrequency ?? existing?.meetingFrequency,
    );
    if (!hasFrequency) {
      throw new BadRequestException({
        code: 'PROFILE_FREQUENCY_REQUIRED',
        message: 'Meeting frequency is required to complete onboarding',
      });
    }
  }
}
