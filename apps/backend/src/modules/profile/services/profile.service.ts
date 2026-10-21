import {
  ProfileEntity,
  SaveProfileData,
} from '@/modules/profile/domain/profile.entity';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Injectable } from '@nestjs/common';

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
    return this.profileRepository.saveProfile(userId, data);
  }
}
