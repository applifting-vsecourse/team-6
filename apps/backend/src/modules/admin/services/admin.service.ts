import { AdminStats } from '@/modules/admin/domain/admin-stats';
import { AdminStatsRepository } from '@/modules/admin/repositories/admin-stats.repository';
import { Injectable } from '@nestjs/common';

// A forming kvintet can vote to start once it has this many members.
const READY_TO_VOTE = 3;

@Injectable()
export class AdminService {
  constructor(private readonly repository: AdminStatsRepository) {}

  async getStats(): Promise<AdminStats> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { formingMemberCounts, kvintets, ...users } =
      await this.repository.getCounts(today);
    const formingReady = formingMemberCounts.filter(
      (members) => members >= READY_TO_VOTE,
    ).length;

    return {
      users,
      kvintets: {
        ...kvintets,
        formingSmall: formingMemberCounts.length - formingReady,
        formingReady,
      },
    };
  }
}
