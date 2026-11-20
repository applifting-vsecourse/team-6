import { AdminStatsRepository } from '@/modules/admin/repositories/admin-stats.repository';
import { mock } from 'jest-mock-extended';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const repository = mock<AdminStatsRepository>();
  const service = new AdminService(repository);

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
});
