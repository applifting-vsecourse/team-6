import { AdminController } from '@/modules/admin/controllers/admin.controller';
import { AdminService } from '@/modules/admin/services/admin.service';
import { AdminGuard } from '@/shared/auth/guards/admin.guard';
import { mock } from 'jest-mock-extended';

// The real guard pulls in the better-auth provider, which this Jest setup does not load.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

describe('AdminController', () => {
  const service = mock<AdminService>();
  const controller = new AdminController(service);

  it('requires AdminGuard on the controller', () => {
    expect(Reflect.getMetadata('__guards__', AdminController)).toContain(
      AdminGuard,
    );
  });

  it('returns the aggregated stats from the service', async () => {
    const stats = {
      users: { registered: 1, onboarded: 1, activeToday: 1 },
      kvintets: { total: 0, active: 0, formingSmall: 0, formingReady: 0 },
    };
    service.getStats.mockResolvedValue(stats);

    await expect(controller.getStats()).resolves.toBe(stats);
  });
});
