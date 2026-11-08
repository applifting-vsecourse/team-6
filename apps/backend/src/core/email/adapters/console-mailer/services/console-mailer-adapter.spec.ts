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

  it('redacts verification code query parameters in non-production environments', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'bob@example.com',
      'Verify code',
      '<p>Code link: https://example.com/verify?code=authCode9876</p>',
    );

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('code=[REDACTED]');
    expect(logged).not.toContain('authCode9876');
  });

  it('redacts case-insensitive token and code parameters', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'carol@example.com',
      'Confirm',
      '<a href="https://example.com/api?TOKEN=UPPERCASE_SECRET&CODE=UPPER_CODE">link</a>',
    );

    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('TOKEN=[REDACTED]');
    expect(logged).toContain('CODE=[REDACTED]');
    expect(logged).not.toContain('UPPERCASE_SECRET');
    expect(logged).not.toContain('UPPER_CODE');
  });

  it('redacts both token and code in multi-parameter URLs while preserving safe parameters', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail(
      'dan@example.com',
      'Invite',
      '<a href="https://example.com/login?redirect=%2Ffeed&token=tok123&env=dev&code=cd456">join</a>',
    );

    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('redirect=%2Ffeed');
    expect(logged).toContain('env=dev');
    expect(logged).toContain('&token=[REDACTED]');
    expect(logged).toContain('&code=[REDACTED]');
    expect(logged).not.toContain('tok123');
    expect(logged).not.toContain('cd456');
  });

  it('masks single-character local part email addresses safely', async () => {
    process.env.NODE_ENV = 'development';
    await adapter.sendEmail('x@domain.org', 'Alert', '<p>Hello</p>');

    const logged = debugSpy.mock.calls[0][0];
    expect(logged).toContain('x***@domain.org');
    expect(logged).not.toContain(' x@domain.org');
  });

  it('masks two-character local part email addresses safely', async () => {
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
