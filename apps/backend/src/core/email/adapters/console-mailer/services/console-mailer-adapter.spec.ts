import { ConsoleMailerAdapter } from './console-mailer-adapter';

describe('ConsoleMailerAdapter', () => {
  let adapter: ConsoleMailerAdapter;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    adapter = new ConsoleMailerAdapter();
    // @ts-expect-error accessing private logger
    logSpy = jest.spyOn(adapter.logger, 'log').mockImplementation();
    // @ts-expect-error accessing private logger
    warnSpy = jest.spyOn(adapter.logger, 'warn').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('logs verification links and tokens in development so developers can complete flows', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'alice@example.com',
      'Verify your email address',
      '<p>Click <a href="https://example.com/verify?token=secret12345">here</a></p>',
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('alice@example.com');
    expect(logged).toContain('token=secret12345');
    expect(logged).toContain('Verify your email address');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs verification code query parameters in development terminal output', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'bob@example.com',
      'Verify code',
      '<p>Code link: https://example.com/verify?code=authCode9876</p>',
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('code=authCode9876');
  });

  it('logs email body in production when no external mailer is configured so links remain recoverable', async () => {
    process.env.NODE_ENV = 'production';
    await adapter.sendEmail(
      'secret.user@university.edu',
      'Verify email',
      'Sensitive verification link: https://example.com/verify?token=abcdef',
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain(
      'No external email transport configured in production',
    );
    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('secret.user@university.edu');
    expect(logged).toContain('token=abcdef');
  });

  it('preserves full HTML content in production fallback', async () => {
    process.env.NODE_ENV = 'production';
    const htmlContent =
      '<div>Verification link: https://app.kvinted.cz/verify?token=xyz123</div>';
    await adapter.sendEmail(
      'john.doe@kvintet.cz',
      'Verify your email address',
      htmlContent,
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('john.doe@kvintet.cz');
    expect(logged).toContain('Verify your email address');
    expect(logged).toContain('token=xyz123');
  });
});
