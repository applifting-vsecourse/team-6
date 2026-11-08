import { ConsoleMailerAdapter } from './console-mailer-adapter';

describe('ConsoleMailerAdapter', () => {
  let adapter: ConsoleMailerAdapter;
  let logSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    adapter = new ConsoleMailerAdapter();
    // @ts-expect-error accessing private logger
    logSpy = jest.spyOn(adapter.logger, 'log').mockImplementation();
    // @ts-expect-error accessing private logger
    debugSpy = jest.spyOn(adapter.logger, 'debug').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('redacts tokens and masks email in non-production environments', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'alice@example.com',
      'Password reset',
      '<p>Click <a href="https://example.com/reset?token=secret12345">here</a></p>',
    );

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('al***@example.com');
    expect(logged).toContain('token=[REDACTED]');
    expect(logged).not.toContain('secret12345');
  });

  it('does not log HTML content or raw email in production environment', async () => {
    process.env.NODE_ENV = 'production';
    await adapter.sendEmail(
      'secret.user@university.edu',
      'Verify email',
      'Secret sensitive content with token=abcdef',
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('se***@university.edu');
    expect(logged).toContain('body redacted');
    expect(logged).not.toContain('abcdef');
    expect(logged).not.toContain('Secret sensitive content');
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
