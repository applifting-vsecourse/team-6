import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

export type AdminCounts = {
  registered: number;
  onboarded: number;
  activeToday: number;
  kvintets: { total: number; active: number };
  /** Member count of each forming kvintet. */
  formingMemberCounts: number[];
};

@Injectable()
export class AdminStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCounts(since: Date): Promise<AdminCounts> {
    const [registered, onboarded, activeToday, total, active, forming] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.profile.count({
          where: { onboardingCompletedAt: { not: null } },
        }),
        // Counted in the database: Prisma's count() cannot do DISTINCT on a column.
        this.prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(DISTINCT "userId")::int AS count
          FROM "session" WHERE "updatedAt" >= ${since}
        `.then(([row]) => row.count),
        this.prisma.kvintet.count(),
        this.prisma.kvintet.count({ where: { status: 'ACTIVE' } }),
        this.prisma.kvintet.findMany({
          where: { status: 'FORMING' },
          select: { _count: { select: { members: true } } },
        }),
      ]);

    return {
      registered,
      onboarded,
      activeToday,
      kvintets: { total, active },
      formingMemberCounts: forming.map((kvintet) => kvintet._count.members),
    };
  }
}
