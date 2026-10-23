import { PrismaService } from '@/core/prisma/prisma.service';
import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { getSessionFromRequest } from '@/shared/auth/utils/get-session-from-request';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MemberGuard } from './member.guard';

jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

interface SetupResult {
  guard: MemberGuard;
  context: ExecutionContext;
  request: { session?: unknown; kvintetMember?: unknown };
  prismaMock: { kvintetMember: { findUnique: jest.Mock } };
}

const setup = (
  session: unknown,
  membership: { kvintetId: string; userId: string; kvintet: unknown } | null,
): SetupResult => {
  jest.mocked(getSessionFromRequest).mockResolvedValue(session);
  const prismaMock = {
    kvintetMember: {
      findUnique: jest.fn().mockResolvedValue(membership),
    },
  };
  const guard = new MemberGuard(
    {} as BetterAuth,
    prismaMock as unknown as PrismaService,
  );
  const request: { session?: unknown; kvintetMember?: unknown } = {};
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { guard, context, request, prismaMock };
};

describe('MemberGuard', () => {
  it('rejects a request without a session with 401 Unauthorized', async (): Promise<void> => {
    const { guard, context } = setup(null, null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a signed-in user who is not in any kvintet with 403 Forbidden', async (): Promise<void> => {
    const session = { user: { id: 'u1' } };
    const { guard, context } = setup(session, null);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'forbidden' }),
    });
  });

  it('allows a member through and stores session and kvintetMember on request', async (): Promise<void> => {
    const session = { user: { id: 'u1' } };
    const membership = {
      kvintetId: 'k1',
      userId: 'u1',
      kvintet: { id: 'k1', status: 'FORMING' },
    };
    const { guard, context, request } = setup(session, membership);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toBe(session);
    expect(request.kvintetMember).toBe(membership);
  });
});
