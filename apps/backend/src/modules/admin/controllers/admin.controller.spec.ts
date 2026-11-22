import { AdminController } from '@/modules/admin/controllers/admin.controller';
import { ExportDataset } from '@/modules/admin/domain/admin-export';
import { AdminService } from '@/modules/admin/services/admin.service';
import { Identity } from '@/shared/auth/domain/identity';
import { AdminGuard } from '@/shared/auth/guards/admin.guard';
import { Logger } from '@nestjs/common';
import type { Response } from 'express';
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
  const admin = new Identity('admin-1', 'a@example.com', 'Admin', 'admin');

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

  it('sends the export as a CSV download', async () => {
    service.exportCsv.mockResolvedValue('a,b');
    const res = { setHeader: jest.fn() } as unknown as Response;

    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await expect(
      controller.exportCsv(ExportDataset.Feed, res, admin),
    ).resolves.toBe('a,b');

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="kvintet-feed.csv"',
    );
    // Who took the data out is on record.
    expect(log).toHaveBeenCalledWith(expect.stringContaining('admin-1'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('feed'));
    log.mockRestore();
  });
});
