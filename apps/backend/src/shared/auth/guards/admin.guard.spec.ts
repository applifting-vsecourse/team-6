import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { getSessionFromRequest } from '@/shared/auth/utils/get-session-from-request';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

const setup = (
  session: unknown,
): {
  guard: AdminGuard;
  context: ExecutionContext;
  request: { session?: unknown };
} => {
  jest.mocked(getSessionFromRequest).mockResolvedValue(session);
  const guard = new AdminGuard({} as BetterAuth);
  const request: { session?: unknown } = {};
  const context = {
    switchToHttp: () => ({ getRequest: (): unknown => request }),
  } as unknown as ExecutionContext;
  return { guard, context, request };
};

describe('AdminGuard', () => {
  it('rejects a request without a session with 401 Unauthorized', async (): Promise<void> => {
    const { guard, context } = setup(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a regular user with 403 Forbidden and ADMIN_REQUIRED code', async (): Promise<void> => {
    const { guard, context } = setup({ user: { id: 'u1', role: 'user' } });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: 403,
      response: expect.objectContaining({ code: 'ADMIN_REQUIRED' }),
    });
  });

  it('allows an admin through and stores session on request', async (): Promise<void> => {
    const session = { user: { id: 'u1', role: 'admin' } };
    const { guard, context, request } = setup(session);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toBe(session);
  });
});
