import { MessageController } from '@/modules/chat/controllers/message.controller';
import { KvintetController } from '@/modules/kvintet/controllers/kvintet.controller';
import { WelcomeController } from '@/modules/welcome/controllers/welcome.controller';
import { AllExceptionsFilter } from '@/shared/errors/all-exceptions.filter';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SkipThrottle,
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerStorageService,
} from '@nestjs/throttler';

jest.mock('@/shared/auth/providers/better-auth.provider', () => ({
  InjectBetterAuth: (): undefined => undefined,
}));

describe('Rate Limiting & Throttler', () => {
  let reflector: Reflector;
  let storage: ThrottlerStorageService;

  beforeEach(() => {
    reflector = new Reflector();
    storage = new ThrottlerStorageService();
  });

  const createMockContext = (
    ip: string,
    handler: () => void = (): void => {},
    cls: object = class {},
  ): ExecutionContext => {
    const req = { ip, headers: {} };
    const res = { setHeader: jest.fn() };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => handler,
      getClass: () => cls,
    } as unknown as ExecutionContext;
  };

  it('allows requests within limit and throws ThrottlerException (429) when exceeded', async () => {
    const guard = new ThrottlerGuard(
      { throttlers: [{ name: 'default', ttl: 60000, limit: 2 }] },
      storage,
      reflector,
    );
    await guard.onModuleInit();

    const context = createMockContext('192.168.1.1');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toThrow(
      ThrottlerException,
    );
  });

  it('transforms ThrottlerException to a 429 too_many_requests response via AllExceptionsFilter', async () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: (): unknown => ({ status }) }),
    } as never;
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const filter = new AllExceptionsFilter();
    filter.catch(new ThrottlerException(), host);

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        code: 'too_many_requests',
      }),
    );
  });

  it('bypasses throttling when a route has @SkipThrottle()', async () => {
    @SkipThrottle()
    class SkippedClass {
      handler(): void {}
    }

    const skippedInstance = new SkippedClass();
    const guard = new ThrottlerGuard(
      { throttlers: [{ name: 'default', ttl: 60000, limit: 1 }] },
      storage,
      reflector,
    );
    await guard.onModuleInit();

    const context = createMockContext(
      '192.168.1.1',
      skippedInstance.handler,
      SkippedClass,
    );

    // Multiple calls beyond limit: 1 should all succeed because SkipThrottle is true
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('verifies WelcomeController is decorated with @SkipThrottle() for health probes', () => {
    const isSkipped = reflector.get('THROTTLER:SKIPdefault', WelcomeController);
    expect(isSkipped).toBe(true);
  });

  it('verifies polling endpoints in MessageController have @SkipThrottle()', () => {
    const listSkipped = reflector.get(
      'THROTTLER:SKIPdefault',
      MessageController.prototype.list,
    );
    const unreadSkipped = reflector.get(
      'THROTTLER:SKIPdefault',
      MessageController.prototype.unread,
    );
    expect(listSkipped).toBe(true);
    expect(unreadSkipped).toBe(true);
  });

  it('verifies chat message sending has targeted @Throttle limit', () => {
    const limit = reflector.get(
      'THROTTLER:LIMITdefault',
      MessageController.prototype.send,
    );
    const ttl = reflector.get(
      'THROTTLER:TTLdefault',
      MessageController.prototype.send,
    );
    expect(limit).toBe(20);
    expect(ttl).toBe(60000);
  });

  it('verifies KvintetController polling endpoints have @SkipThrottle()', () => {
    const mineSkipped = reflector.get(
      'THROTTLER:SKIPdefault',
      KvintetController.prototype.getMyKvintet,
    );
    const membershipSkipped = reflector.get(
      'THROTTLER:SKIPdefault',
      KvintetController.prototype.membership,
    );
    expect(mineSkipped).toBe(true);
    expect(membershipSkipped).toBe(true);
  });
});
