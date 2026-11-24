import { ExportDataset } from '@/modules/admin/domain/admin-export';
import { AdminStats } from '@/modules/admin/domain/admin-stats';
import { toCsv } from '@/modules/admin/domain/csv';
import { AdminExportRepository } from '@/modules/admin/repositories/admin-export.repository';
import { AdminStatsRepository } from '@/modules/admin/repositories/admin-stats.repository';
import { exportToken } from '@/modules/matching/subject';
import { Injectable } from '@nestjs/common';

// A forming kvintet can vote to start once it has this many members.
const READY_TO_VOTE = 3;

const minutesBetween = (from: Date, to: Date | null): number | null =>
  to ? Math.round((to.getTime() - from.getTime()) / 60_000) : null;

@Injectable()
export class AdminService {
  constructor(
    private readonly repository: AdminStatsRepository,
    private readonly exports: AdminExportRepository,
  ) {}

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

  async exportCsv(dataset: ExportDataset): Promise<string> {
    switch (dataset) {
      case ExportDataset.Feed:
        return toCsv(
          [
            'snapshot',
            'user',
            'loadedAt',
            'fallback',
            'position',
            'kvintet',
            'score',
          ],
          (await this.exports.feedSnapshots()).flatMap((snapshot) =>
            snapshot.items.map((item, position) => [
              snapshot.id,
              exportToken(snapshot.subject),
              snapshot.createdAt,
              snapshot.fallback,
              position,
              item.kvintetId,
              item.score,
            ]),
          ),
        );
      case ExportDataset.Memberships:
        return toCsv(
          [
            'user',
            'kvintet',
            'source',
            'joinedAt',
            'leftAt',
            'stayMinutes',
            'position',
            'listSize',
            'score',
          ],
          (await this.exports.memberships()).map((row) => [
            exportToken(row.subject),
            row.kvintetId,
            row.source,
            row.joinedAt,
            row.leftAt,
            minutesBetween(row.joinedAt, row.leftAt),
            row.position,
            row.listSize,
            row.score,
          ]),
        );
      case ExportDataset.Kvintets:
        return toCsv(
          [
            'kvintet',
            'createdAt',
            'activatedAt',
            'endedAt',
            'outcome',
            'listedMinutes',
          ],
          (await this.exports.kvintets()).map((row) => [
            row.kvintetId,
            row.createdAt,
            row.activatedAt,
            row.endedAt,
            row.activatedAt ? 'STARTED' : row.endedAt ? 'DISBANDED' : 'LISTED',
            // Listed until it started, or until it was disbanded.
            minutesBetween(row.createdAt, row.activatedAt ?? row.endedAt),
          ]),
        );
      case ExportDataset.Users:
        return toCsv(
          [
            'user',
            'onboardedAt',
            'firstJoinedAt',
            'minutesToFirstJoin',
            'feedLoads',
            'bestScore',
          ],
          (await this.exports.onboardedUsers()).map((row) => {
            const scores = row.feedScores.flat();
            return [
              exportToken(row.subject),
              row.onboardedAt,
              row.firstJoinedAt,
              minutesBetween(row.onboardedAt, row.firstJoinedAt),
              row.feedScores.length,
              scores.length > 0 ? Math.max(...scores) : null,
            ];
          }),
        );
    }
  }
}
