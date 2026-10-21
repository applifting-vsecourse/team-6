import { PrismaService } from '@/core/prisma/prisma.service';
import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { getSessionFromRequest } from '@/shared/auth/utils/get-session-from-request';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { OnboardedGuard } from './onboarded.guard';

jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

interface SetupResult {
  guard: OnboardedGuard;
  context: ExecutionContext;
  request: { session?: unknown };
  prismaMock: { profile: { findUnique: jest.Mock } };
}

const setup = (
  session: unknown,
  profile: { onboardingCompletedAt: Date | null } | null,
): SetupResult => {
  jest.mocked(getSessionFromRequest).mockResolvedValue(session);
  const prismaMock = {
    profile: {
      findUnique: jest.fn().mockResolvedValue(profile),
    },
  };
  const guard = new OnboardedGuard(
    {} as BetterAuth,
    prismaMock as unknown as PrismaService,
  );
  const request: { session?: unknown } = {};
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { guard, context, request, prismaMock };
};

describe('OnboardedGuard', () => {
  it('rejects a request without a session with 401 Unauthorized', async (): Promise<void> => {
    const { guard, context } = setup(null, null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a signed-in user without a profile with 403 Forbidden', async (): Promise<void> => {
    const session = { user: { id: 'u1' } };
    const { guard, context } = setup(session, null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a user whose onboarding is incomplete with 403 Forbidden', async (): Promise<void> => {
    const session = { user: { id: 'u1' } };
    const { guard, context } = setup(session, { onboardingCompletedAt: null });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows an onboarded user through and stores session on request', async (): Promise<void> => {
    const session = { user: { id: 'u1' } };
    const completedAt = new Date('2026-10-21T12:00:00Z');
    const { guard, context, request } = setup(session, {
      onboardingCompletedAt: completedAt,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toBe(session);
  });
});
