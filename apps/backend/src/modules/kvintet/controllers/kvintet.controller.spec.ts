import { KvintetController } from '@/modules/kvintet/controllers/kvintet.controller';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { mock } from 'jest-mock-extended';

// The real guard pulls in the better-auth provider (.tsx email templates, ESM-only
// packages) which this Jest setup does not load; its behaviour has its own spec.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: () => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

describe('KvintetController', () => {
  it('requires a signed-in user on every route', () => {
    const guards = Reflect.getMetadata('__guards__', KvintetController);

    expect(guards).toContain(AuthenticatedUserGuard);
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

    const [item] = await controller.feed({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      role: 'user',
    });

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
});
