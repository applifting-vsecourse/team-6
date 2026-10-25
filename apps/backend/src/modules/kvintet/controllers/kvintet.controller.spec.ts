import { PrismaService } from '@/core/prisma/prisma.service';
import { KvintetController } from '@/modules/kvintet/controllers/kvintet.controller';
import { KvintetDetails } from '@/modules/kvintet/domain/kvintet';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { MemberGuard } from '@/shared/auth/guards/member.guard';
import { OnboardedGuard } from '@/shared/auth/guards/onboarded.guard';
import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';

// The real guard pulls in the better-auth provider (.tsx email templates, ESM-only
// packages) which this Jest setup does not load; its behaviour has its own spec.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

describe('KvintetController', () => {
  it('requires a signed-in and onboarded user on every route', () => {
    const guards = Reflect.getMetadata('__guards__', KvintetController);

    expect(guards).toContain(AuthenticatedUserGuard);
    expect(guards).toContain(OnboardedGuard);
  });

  it('rejects a non-onboarded user with 403 Forbidden', async () => {
    const prisma = {
      profile: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ onboardingCompletedAt: null }),
      },
    } as unknown as PrismaService;
    const guard = new OnboardedGuard({} as BetterAuth, prisma);
    const context = {
      switchToHttp: () => ({
        getRequest: (): unknown => ({
          session: { user: { id: 'u1' } },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('passes the category query on to the feed', async () => {
    const repository = mock<KvintetRepository>();
    repository.isMember.mockResolvedValue(false);
    repository.categoryExists.mockResolvedValue(true);
    repository.findOpenKvintets.mockResolvedValue([]);
    const controller = new KvintetController(new KvintetService(repository));

    await controller.feed(
      { id: 'u1', email: 'a@b.c', name: 'A', role: 'user' },
      { category: 'languages' },
    );

    expect(repository.findOpenKvintets).toHaveBeenCalledWith('languages');
  });

  it('answers the feed with an allow-list of fields and nothing else', async () => {
    const repository = mock<KvintetRepository>();
    repository.isMember.mockResolvedValue(false);
    repository.findOpenKvintets.mockResolvedValue([
      {
        id: 'kvintet-1',
        title: 'Using AI at work',
        category: 'technology',
        members: [
          {
            position: 'Backend developer',
            meetingFrequency: 'WEEKLY',
            teach: ['python'],
            learn: [],
            interests: [],
          },
        ],
      },
    ]);
    const controller = new KvintetController(new KvintetService(repository));

    const [item] = await controller.feed(
      { id: 'u1', email: 'a@b.c', name: 'A', role: 'user' },
      {},
    );

    // A new field on the feed must be added here on purpose: names, e-mails and
    // user ids must never reach this response.
    expect(Object.keys(item).sort()).toEqual([
      'capacity',
      'category',
      'id',
      'meetingFrequency',
      'memberCount',
      'members',
      'title',
    ]);
    expect(Object.keys(item.members[0]).sort()).toEqual([
      'interests',
      'learn',
      'position',
      'teach',
    ]);
  });

  describe('member endpoints', () => {
    const mockDetails: KvintetDetails = {
      id: 'k1',
      title: 'AI v práci',
      status: 'FORMING',
      createdAt: new Date('2026-10-21T10:00:00Z'),
      activatedAt: null,
      commonPreferences: {
        city: 'Praha',
        meetingFrequency: 'BIWEEKLY',
        weekdays: true,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: true,
      },
      capacity: 5,
      openSeatsCount: 1,
      members: [],
      voteStatus: {
        canVote: true,
        userHasVoted: false,
        votedCount: 3,
        totalCount: 4,
      },
    };

    const mockUser = {
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      role: 'user' as const,
    };

    it('requires MemberGuard on getMyKvintet, vote, and leave', () => {
      const getMyKvintetGuards = Reflect.getMetadata(
        '__guards__',
        KvintetController.prototype.getMyKvintet,
      );
      const voteGuards = Reflect.getMetadata(
        '__guards__',
        KvintetController.prototype.vote,
      );
      const leaveGuards = Reflect.getMetadata(
        '__guards__',
        KvintetController.prototype.leave,
      );

      expect(getMyKvintetGuards).toContain(MemberGuard);
      expect(voteGuards).toContain(MemberGuard);
      expect(leaveGuards).toContain(MemberGuard);
    });

    it('getMyKvintet returns formatted details', async () => {
      const service = mock<KvintetService>();
      service.getMyKvintet.mockResolvedValue(mockDetails);
      const controller = new KvintetController(service);

      const result = await controller.getMyKvintet(mockUser);

      expect(service.getMyKvintet).toHaveBeenCalledWith('u1');
      expect(result.id).toBe('k1');
      expect(result.createdAt).toBe('2026-10-21T10:00:00.000Z');
      expect(result.activatedAt).toBeNull();
    });

    it('vote returns updated formatted details', async () => {
      const service = mock<KvintetService>();
      service.vote.mockResolvedValue({
        ...mockDetails,
        activatedAt: new Date('2026-10-21T12:00:00Z'),
      });
      const controller = new KvintetController(service);

      const result = await controller.vote(mockUser);

      expect(service.vote).toHaveBeenCalledWith('u1');
      expect(result.activatedAt).toBe('2026-10-21T12:00:00.000Z');
    });

    it('leave returns success response', async () => {
      const service = mock<KvintetService>();
      service.leave.mockResolvedValue({ success: true });
      const controller = new KvintetController(service);

      const result = await controller.leave(mockUser);

      expect(service.leave).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true });
    });
  });
});
