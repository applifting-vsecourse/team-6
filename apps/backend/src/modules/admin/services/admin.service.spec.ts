import { ExportDataset } from '@/modules/admin/domain/admin-export';
import { AdminExportRepository } from '@/modules/admin/repositories/admin-export.repository';
import { AdminStatsRepository } from '@/modules/admin/repositories/admin-stats.repository';
import { mock } from 'jest-mock-extended';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const repository = mock<AdminStatsRepository>();
  const exports = mock<AdminExportRepository>();
  const service = new AdminService(repository, exports);

  it('splits forming kvintets into 1–2 and 3–4 members and counts from midnight UTC', async () => {
    repository.getCounts.mockResolvedValue({
      registered: 20,
      onboarded: 15,
      activeToday: 4,
      kvintets: { total: 6, active: 1 },
      formingMemberCounts: [1, 2, 3, 4, 1],
    });

    await expect(service.getStats()).resolves.toEqual({
      users: { registered: 20, onboarded: 15, activeToday: 4 },
      kvintets: { total: 6, active: 1, formingSmall: 3, formingReady: 2 },
    });

    const since = repository.getCounts.mock.calls[0][0];
    expect(since.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  describe('exportCsv', () => {
    const at = (iso: string): Date => new Date(iso);

    it('writes a short token of the stored subject, the same every time, and leaves rows without one empty', async () => {
      exports.memberships.mockResolvedValue([
        {
          subject: 'a1b2c3d4e5f6a7b8c9d0',
          kvintetId: 'k1',
          source: 'JOINED',
          joinedAt: at('2026-11-21T10:00:00Z'),
          leftAt: at('2026-11-21T11:30:00Z'),
          position: 2,
          listSize: 5,
          score: 61.5,
        },
        {
          subject: 'a1b2c3d4e5f6a7b8c9d0',
          kvintetId: 'k2',
          source: 'STARTED',
          joinedAt: at('2026-11-22T10:00:00Z'),
          leftAt: null,
          position: null,
          listSize: null,
          score: null,
        },
        {
          subject: null,
          kvintetId: 'k1',
          source: 'JOINED',
          joinedAt: at('2026-11-21T10:00:00Z'),
          leftAt: null,
          position: null,
          listSize: null,
          score: null,
        },
      ]);

      const [header, first, second, anonymous] = (
        await service.exportCsv(ExportDataset.Memberships)
      ).split('\n');

      expect(header).toBe(
        'user;kvintet;source;joinedAt;leftAt;stayMinutes;position;listSize;score',
      );
      const token = first.split(';')[0];
      expect(token).toMatch(/^[0-9a-f]{12}$/);
      expect(token).toBe('a1b2c3d4e5f6');
      expect(first).toBe(
        `${token};k1;JOINED;2026-11-21T10:00:00.000Z;2026-11-21T11:30:00.000Z;90;2;5;61.5`,
      );
      expect(second.startsWith(`${token};k2;STARTED;`)).toBe(true);
      expect(anonymous.startsWith(';k1;JOINED;')).toBe(true);
    });

    it('writes one feed row per listed kvintet, with its position and score', async () => {
      exports.feedSnapshots.mockResolvedValue([
        {
          id: 7,
          subject: null,
          createdAt: at('2026-11-21T10:00:00Z'),
          fallback: true,
          items: [
            { kvintetId: 'a', score: 40 },
            { kvintetId: 'b', score: 30 },
          ],
        },
      ]);

      const rows = (await service.exportCsv(ExportDataset.Feed)).split('\n');

      expect(rows.slice(1)).toEqual([
        '7;;2026-11-21T10:00:00.000Z;true;0;a;40',
        '7;;2026-11-21T10:00:00.000Z;true;1;b;30',
      ]);
    });

    it('tells how long a kvintet was listed and how it ended', async () => {
      exports.kvintets.mockResolvedValue([
        {
          kvintetId: 'started',
          createdAt: at('2026-11-21T10:00:00Z'),
          activatedAt: at('2026-11-21T12:00:00Z'),
          endedAt: at('2026-11-23T12:00:00Z'),
        },
        {
          kvintetId: 'disbanded',
          createdAt: at('2026-11-21T10:00:00Z'),
          activatedAt: null,
          endedAt: at('2026-11-21T10:45:00Z'),
        },
        {
          kvintetId: 'listed',
          createdAt: at('2026-11-21T10:00:00Z'),
          activatedAt: null,
          endedAt: null,
        },
      ]);

      const rows = (await service.exportCsv(ExportDataset.Kvintets)).split(
        '\n',
      );

      expect(rows.slice(1).map((row) => row.split(';').slice(4))).toEqual([
        ['STARTED', '120'],
        ['DISBANDED', '45'],
        ['LISTED', ''],
      ]);
    });

    it('gives the time to the first join, or the best score for someone who never joined', async () => {
      exports.onboardedUsers.mockResolvedValue([
        {
          subject: 'joined',
          onboardedAt: at('2026-11-21T10:00:00Z'),
          firstJoinedAt: at('2026-11-21T10:20:00Z'),
          feedScores: [[50, 70], [65]],
        },
        {
          subject: 'never',
          onboardedAt: at('2026-11-21T10:00:00Z'),
          firstJoinedAt: null,
          feedScores: [[20], [35, 10]],
        },
        {
          subject: 'empty',
          onboardedAt: at('2026-11-21T10:00:00Z'),
          firstJoinedAt: null,
          feedScores: [],
        },
      ]);

      const rows = (await service.exportCsv(ExportDataset.Users)).split('\n');

      expect(rows.slice(1).map((row) => row.split(';').slice(2))).toEqual([
        ['2026-11-21T10:20:00.000Z', '20', '2', '70'],
        ['', '', '2', '35'],
        ['', '', '0', ''],
      ]);
    });
  });
});
