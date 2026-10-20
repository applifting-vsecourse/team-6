import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { getSessionFromRequest } from '@/shared/auth/utils/get-session-from-request';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUserGuard } from './authenticated-user.guard';

// The real provider and session helper pull in .tsx email templates and the
// ESM-only better-auth/node, which this Jest setup does not load. The guard
// only needs the decorator and the session lookup result.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: () => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

const setup = (session: unknown) => {
  jest.mocked(getSessionFromRequest).mockResolvedValue(session);
  const guard = new AuthenticatedUserGuard({} as BetterAuth);
  const request: { session?: unknown } = {};
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { guard, context, request };
};

describe('AuthenticatedUserGuard', () => {
  it('rejects a request without a session with 401', async () => {
    const { guard, context } = setup(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lets a signed-in request through and exposes the session on it', async () => {
    const session = { user: { id: 'u1' } };
    const { guard, context, request } = setup(session);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toBe(session);
  });
});
