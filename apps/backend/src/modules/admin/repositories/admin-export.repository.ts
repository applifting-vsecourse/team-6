import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FeedSnapshotRow,
  KvintetLogRow,
  MembershipRow,
  OnboardedUserRow,
} from '@/modules/admin/domain/admin-export';
import { Injectable } from '@nestjs/common';

// Reads the matching-data tables for the CSV export. Rows are returned as stored; the service
// replaces user ids with a pseudonym before anything leaves the server.
@Injectable()
export class AdminExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async feedSnapshots(): Promise<FeedSnapshotRow[]> {
    const rows = await this.prisma.feedSnapshot.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      items: row.items as FeedSnapshotRow['items'],
    }));
  }

  memberships(): Promise<MembershipRow[]> {
    return this.prisma.membershipLog.findMany({
      orderBy: { id: 'asc' },
      select: {
        userId: true,
        kvintetId: true,
        source: true,
        joinedAt: true,
        leftAt: true,
        position: true,
        listSize: true,
        score: true,
      },
    });
  }

  kvintets(): Promise<KvintetLogRow[]> {
    return this.prisma.kvintetLog.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async onboardedUsers(): Promise<OnboardedUserRow[]> {
    const profiles = await this.prisma.profile.findMany({
      where: { onboardingCompletedAt: { not: null } },
      select: {
        userId: true,
        onboardingCompletedAt: true,
        user: {
          select: {
            membershipLogs: {
              select: { joinedAt: true },
              orderBy: { joinedAt: 'asc' },
              take: 1,
            },
            feedSnapshots: { select: { items: true } },
          },
        },
      },
    });
    return profiles.map(({ userId, onboardingCompletedAt, user }) => ({
      userId,
      onboardedAt: onboardingCompletedAt!,
      firstJoinedAt: user.membershipLogs[0]?.joinedAt ?? null,
      feedScores: user.feedSnapshots.map(({ items }) =>
        (items as FeedSnapshotRow['items']).map((item) => item.score),
      ),
    }));
  }
}
