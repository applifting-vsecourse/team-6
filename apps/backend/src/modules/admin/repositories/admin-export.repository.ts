import { PrismaService } from '@/core/prisma/prisma.service';
import {
  FeedSnapshotRow,
  KvintetLogRow,
  MembershipRow,
  OnboardedUserRow,
} from '@/modules/admin/domain/admin-export';
import { matchingSubject } from '@/modules/matching/subject';
import { Config } from '@/shared/config/config.service';
import { Injectable } from '@nestjs/common';

// Reads the matching-data tables for the CSV export. Rows are returned as stored; the service
// replaces user ids with a pseudonym before anything leaves the server.
@Injectable()
export class AdminExportRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: Config,
  ) {}

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
        subject: true,
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
      select: { userId: true, onboardingCompletedAt: true },
    });
    const users = profiles.map(({ userId, onboardingCompletedAt }) => ({
      subject: matchingSubject(this.config.betterAuthSecret, userId),
      onboardedAt: onboardingCompletedAt!,
    }));
    const subjects = users.map((user) => user.subject);
    const [stays, snapshots] = await Promise.all([
      this.prisma.membershipLog.findMany({
        where: { subject: { in: subjects } },
        select: { subject: true, joinedAt: true },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.feedSnapshot.findMany({
        where: { subject: { in: subjects } },
        select: { subject: true, items: true },
      }),
    ]);
    const firstJoined = new Map<string, Date>();
    for (const { subject, joinedAt } of stays) {
      if (subject && !firstJoined.has(subject))
        firstJoined.set(subject, joinedAt);
    }
    const scores = new Map<string, number[][]>();
    for (const { subject, items } of snapshots) {
      if (!subject) continue;
      const loads = scores.get(subject) ?? [];
      loads.push((items as FeedSnapshotRow['items']).map((item) => item.score));
      scores.set(subject, loads);
    }
    return users.map((user) => ({
      ...user,
      firstJoinedAt: firstJoined.get(user.subject) ?? null,
      feedScores: scores.get(user.subject) ?? [],
    }));
  }
}
