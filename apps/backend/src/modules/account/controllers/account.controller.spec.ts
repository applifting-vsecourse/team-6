import { AccountController } from '@/modules/account/controllers/account.controller';
import { AccountService } from '@/modules/account/services/account.service';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { mock } from 'jest-mock-extended';

// The real guard pulls in the better-auth provider (.tsx email templates, ESM-only
// packages) which this Jest setup does not load; its behaviour has its own spec.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

describe('AccountController', () => {
  const service = mock<AccountService>();
  const controller = new AccountController(service);

  const mockUser: Identity = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires AuthenticatedUserGuard on the controller', () => {
    const guards = Reflect.getMetadata('__guards__', AccountController);
    expect(guards).toContain(AuthenticatedUserGuard);
  });

  it('calls accountService.deleteAccount and returns { success: true }', async () => {
    service.deleteAccount.mockResolvedValue(undefined);

    const result = await controller.deleteAccount(mockUser);

    expect(service.deleteAccount).toHaveBeenCalledWith('user-123');
    expect(result).toEqual({ success: true });
  });
});
