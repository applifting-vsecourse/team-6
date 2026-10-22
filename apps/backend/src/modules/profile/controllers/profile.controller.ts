import {
  ProfileEntity,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { ProfileService } from '@/modules/profile/services/profile.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { Body, Controller, Get, Put, Res, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { SaveProfileDto } from './dto/save-profile.dto';

@ApiTags('profile')
@ApiCookieAuth()
@UseGuards(AuthenticatedUserGuard)
@Controller('me/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the authenticated user profile, tags, and onboarding status',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  async getProfile(
    @User() user: Identity,
    @Res() res: Response,
  ): Promise<void> {
    const profile = await this.profileService.getProfile(user.id);
    if (!profile) {
      res.status(200).json(null);
      return;
    }
    res.status(200).json(this.toResponseDto(profile));
  }

  @Put()
  @ApiOperation({
    summary: 'Create or update profile',
    description:
      'Saves profile, tags, questionnaire and optionally marks onboarding as complete',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile saved successfully',
    type: ProfileResponseDto,
  })
  async saveProfile(
    @User() user: Identity,
    @Body() dto: SaveProfileDto,
  ): Promise<ProfileResponseDto> {
    const roles =
      dto.roles && dto.roles.length > 0
        ? dto.roles
        : dto.position
          ? [dto.position]
          : [];
    const position = roles[0] ?? dto.position;

    const profile = await this.profileService.saveProfile(user.id, {
      position,
      roles,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      teachTagIds: dto.teachTagIds,
      learnTagIds: dto.learnTagIds,
      interestTagIds: dto.interestTagIds,
      weekdays: dto.weekdays,
      weekends: dto.weekends,
      mornings: dto.mornings,
      afternoons: dto.afternoons,
      evenings: dto.evenings,
      cityId: dto.cityId ?? null,
      radiusKm: dto.radiusKm ?? null,
      expectations: dto.expectations,
      meetingFrequency: dto.meetingFrequency,
      note: dto.note,
      completeOnboarding: dto.completeOnboarding ?? false,
    });

    return this.toResponseDto(profile);
  }

  private toResponseDto(profile: ProfileEntity): ProfileResponseDto {
    const teaches = profile.tags
      .filter((t) => t.kind === TagKind.TEACH)
      .map((t) => ({ id: t.tagId, slug: t.slug }));
    const learns = profile.tags
      .filter((t) => t.kind === TagKind.LEARN)
      .map((t) => ({ id: t.tagId, slug: t.slug }));
    const interests = profile.tags
      .filter((t) => t.kind === TagKind.INTEREST)
      .map((t) => ({ id: t.tagId, slug: t.slug }));

    return {
      userId: profile.userId,
      position: profile.position,
      roles: profile.roles ?? (profile.position ? [profile.position] : []),
      latitude: profile.latitude,
      longitude: profile.longitude,
      expectations: profile.expectations ?? [],
      meetingFrequency: profile.meetingFrequency,
      weekdays: profile.weekdays,
      weekends: profile.weekends,
      mornings: profile.mornings,
      afternoons: profile.afternoons,
      evenings: profile.evenings,
      cityId: profile.cityId,
      cityName: profile.cityName,
      radiusKm: profile.radiusKm,
      note: profile.note,
      onboardingCompletedAt: profile.onboardingCompletedAt,
      teaches,
      learns,
      interests,
    };
  }
}
