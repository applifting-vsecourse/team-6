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

  it('preserves verification links and tokens in development so developers can complete flows', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'alice@example.com',
      'Password reset',
      '<p>Click <a href="https://example.com/reset?token=secret12345">here</a></p>',
    );

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('al***@example.com');
    expect(logged).toContain('token=secret12345');
    expect(logged).toContain('Password reset');
  });

  it('preserves verification code query parameters in development terminal output', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'bob@example.com',
      'Verify code',
      '<p>Code link: https://example.com/verify?code=authCode9876</p>',
    );

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('code=authCode9876');
  });

  it('masks recipient email addresses with short prefixes in development', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail('x@domain.org', 'Alert', '<p>Hello</p>');

    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('x***@domain.org');
    expect(logged).not.toContain(' x@domain.org');
  });

  it('masks two-character local part email addresses in development', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail('ab@domain.org', 'Alert', '<p>Hello</p>');

    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('ab***@domain.org');
    expect(logged).not.toContain(' ab@domain.org');
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

  it('logs subject and masked recipient but zero body bytes in production', async () => {
    process.env.NODE_ENV = 'production';
    const longHtml = '<div>' + 'A'.repeat(5000) + '</div>';
    await adapter.sendEmail('john.doe@kvintet.cz', 'Kvintet Update', longHtml);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('jo***@kvintet.cz');
    expect(logged).toContain('Kvintet Update');
    expect(logged).not.toContain('AAAAA');
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
