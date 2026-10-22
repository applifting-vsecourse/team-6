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
    if (data.completeOnboarding) {
      this.validateCompleteProfile(data);
    }
    return this.profileRepository.saveProfile(userId, data);
  }

  private validateCompleteProfile(data: SaveProfileData): void {
    const hasRole =
      (data.roles &&
        data.roles.length > 0 &&
        data.roles.some((r) => r.trim().length > 0)) ||
      Boolean(data.position?.trim());
    if (!hasRole) {
      throw new BadRequestException(
        'At least one role is required to complete onboarding',
      );
    }

    const hasLocation =
      (data.latitude != null && data.longitude != null) || Boolean(data.cityId);
    if (!hasLocation) {
      throw new BadRequestException(
        'Location coordinates or city is required to complete onboarding',
      );
    }

    const hasAvailability =
      data.weekdays ||
      data.weekends ||
      data.mornings ||
      data.afternoons ||
      data.evenings;
    if (!hasAvailability) {
      throw new BadRequestException(
        'At least one availability slot is required to complete onboarding',
      );
    }
  }
}
