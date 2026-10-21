import { PrismaService } from '@/core/prisma/prisma.service';
import {
  MeetingFrequency,
  ProfileEntity,
  ProfileTagEntity,
  SaveProfileData,
  TagKind,
} from '@/modules/profile/domain/profile.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ProfileEntity | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        city: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!profile) return null;

    let parsedExpectations: string[] = [];
    if (profile.expectations) {
      try {
        parsedExpectations = JSON.parse(profile.expectations);
      } catch {
        parsedExpectations = [profile.expectations];
      }
    }

    const tags = profile.tags.map(
      (pt) => new ProfileTagEntity(pt.tagId, pt.tag.slug, pt.kind as TagKind),
    );

    const roles =
      profile.roles && profile.roles.length > 0
        ? profile.roles
        : profile.position
          ? [profile.position]
          : [];

    return new ProfileEntity(
      profile.userId,
      profile.position,
      parsedExpectations,
      profile.meetingFrequency as MeetingFrequency | null,
      profile.weekdays,
      profile.weekends,
      profile.mornings,
      profile.afternoons,
      profile.evenings,
      profile.cityId,
      profile.city?.name ?? null,
      profile.radiusKm,
      profile.note,
      profile.onboardingCompletedAt,
      tags,
      roles,
      profile.latitude,
      profile.longitude,
    );
  }

  async saveProfile(
    userId: string,
    data: SaveProfileData,
  ): Promise<ProfileEntity> {
    const expectationsString = data.expectations
      ? JSON.stringify(data.expectations)
      : null;

    const roles =
      data.roles && data.roles.length > 0
        ? data.roles
        : data.position
          ? [data.position]
          : [];
    const position = roles[0] ?? data.position ?? null;

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.profile.findUnique({
        where: { userId },
      });

      const onboardingCompletedAt = data.completeOnboarding
        ? (existing?.onboardingCompletedAt ?? new Date())
        : (existing?.onboardingCompletedAt ?? null);

      await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          position,
          roles,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          expectations: expectationsString,
          meetingFrequency: data.meetingFrequency ?? null,
          weekdays: data.weekdays,
          weekends: data.weekends,
          mornings: data.mornings,
          afternoons: data.afternoons,
          evenings: data.evenings,
          cityId: data.cityId ?? null,
          radiusKm: data.radiusKm ?? null,
          note: data.note ?? null,
          onboardingCompletedAt,
        },
        update: {
          position,
          roles,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          expectations: expectationsString,
          meetingFrequency: data.meetingFrequency ?? null,
          weekdays: data.weekdays,
          weekends: data.weekends,
          mornings: data.mornings,
          afternoons: data.afternoons,
          evenings: data.evenings,
          cityId: data.cityId ?? null,
          radiusKm: data.radiusKm ?? null,
          note: data.note ?? null,
          ...(data.completeOnboarding && !existing?.onboardingCompletedAt
            ? { onboardingCompletedAt: new Date() }
            : {}),
        },
      });

      // Replace profile tags
      await tx.profileTag.deleteMany({
        where: { userId },
      });

      const profileTagCreates = [
        ...data.teachTagIds.map((tagId) => ({
          userId,
          tagId,
          kind: TagKind.TEACH,
        })),
        ...data.learnTagIds.map((tagId) => ({
          userId,
          tagId,
          kind: TagKind.LEARN,
        })),
        ...data.interestTagIds.map((tagId) => ({
          userId,
          tagId,
          kind: TagKind.INTEREST,
        })),
      ];

      if (profileTagCreates.length > 0) {
        await tx.profileTag.createMany({
          data: profileTagCreates,
          skipDuplicates: true,
        });
      }
    });

    const result = await this.findByUserId(userId);
    if (!result) {
      throw new Error('Failed to retrieve profile after save');
    }
    return result;
  }
}
