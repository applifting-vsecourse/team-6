import { PrismaService } from '@/core/prisma/prisma.service';
import { ListMessagesQueryDto } from '@/modules/chat/controllers/dto/list-messages-query.dto';
import { SendMessageDto } from '@/modules/chat/controllers/dto/send-message.dto';
import { MessageController } from '@/modules/chat/controllers/message.controller';
import { ChatMessage } from '@/modules/chat/domain/message';
import { MessageService } from '@/modules/chat/services/message.service';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { MemberGuard } from '@/shared/auth/guards/member.guard';
import { OnboardedGuard } from '@/shared/auth/guards/onboarded.guard';
import type { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import {
  createValidationPipe,
  ValidationFailedException,
} from '@/shared/errors/validation.pipe';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';

// See kvintet.controller.spec.ts: the real provider pulls in ESM-only packages.
jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: () => undefined,
}));
jest.mock('@/shared/auth/utils/get-session-from-request', () => ({
  getSessionFromRequest: jest.fn(),
}));

const caller = { id: 'u1', email: 'a@b.c', name: 'A', role: 'user' } as const;

describe('MessageController', () => {
  it('requires a signed-in, onboarded member on every route', () => {
    const guards = Reflect.getMetadata('__guards__', MessageController);

    expect(guards).toEqual([
      AuthenticatedUserGuard,
      OnboardedGuard,
      MemberGuard,
    ]);
  });

  it('gives an admin who is not in the kvintet no access', async () => {
    const prisma = {
      kvintetMember: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const guard = new MemberGuard({} as BetterAuth, prisma);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: { user: { id: 'admin-1', role: 'admin' } },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('answers with an allow-list of fields and ISO timestamps', async () => {
    const service = mock<MessageService>();
    const message: ChatMessage = {
      id: 7,
      kind: 'USER',
      authorId: 'u2',
      authorName: 'Petr Svoboda',
      authorUsername: 'petr',
      body: 'Hello',
      createdAt: new Date('2026-10-22T18:02:00.000Z'),
    };
    service.list.mockResolvedValue([message]);
    service.send.mockResolvedValue(message);
    const controller = new MessageController(service);
    const expected = {
      id: 7,
      kind: 'USER',
      authorId: 'u2',
      authorName: 'Petr Svoboda',
      authorUsername: 'petr',
      body: 'Hello',
      createdAt: '2026-10-22T18:02:00.000Z',
    };

    await expect(controller.list(caller, { after: 3 })).resolves.toEqual([
      expected,
    ]);
    expect(service.list).toHaveBeenCalledWith('u1', { after: 3 });
    await expect(controller.send(caller, { body: 'Hello' })).resolves.toEqual(
      expected,
    );
  });

  it('rejects an empty or too long body without echoing it', async () => {
    const pipe = createValidationPipe();
    const meta = { type: 'body', metatype: SendMessageDto } as const;
    const secret = 'x'.repeat(1001);

    const tooLong = await pipe
      .transform({ body: secret }, meta)
      .catch((e) => e);
    expect(tooLong).toBeInstanceOf(ValidationFailedException);
    expect((tooLong as ValidationFailedException).errors).toEqual([
      { field: 'body', code: 'maxLength' },
    ]);
    expect(JSON.stringify(tooLong.errors)).not.toContain(secret);

    const blank = await pipe.transform({ body: '   ' }, meta).catch((e) => e);
    expect((blank as ValidationFailedException).errors).toEqual([
      { field: 'body', code: 'isNotEmpty' },
    ]);
  });

  it('rejects a cursor outside the id range with a 400, not a database error', async () => {
    const pipe = createValidationPipe();
    const meta = { type: 'query', metatype: ListMessagesQueryDto } as const;

    const tooBig = await pipe
      .transform({ after: '2147483648' }, meta)
      .catch((e) => e);
    expect((tooBig as ValidationFailedException).errors).toEqual([
      { field: 'after', code: 'max' },
    ]);

    const negative = await pipe
      .transform({ before: '-1' }, meta)
      .catch((e) => e);
    expect((negative as ValidationFailedException).errors).toEqual([
      { field: 'before', code: 'min' },
    ]);

    await expect(
      pipe.transform({ after: '2147483647' }, meta),
    ).resolves.toMatchObject({ after: 2147483647 });
  });
});
