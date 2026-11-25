import { ConsoleMailerAdapter } from './console-mailer-adapter';

describe('ConsoleMailerAdapter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs nothing about the e-mail: no recipient, subject, name or link', async () => {
    const adapter = new ConsoleMailerAdapter();
    // @ts-expect-error accessing private logger
    const logger = adapter.logger as { log: jest.Mock; warn: jest.Mock };
    const log = jest.spyOn(logger, 'log').mockImplementation();
    const warn = jest.spyOn(logger, 'warn').mockImplementation();

    await (
      adapter.sendEmail as (
        to: string,
        subject: string,
        html: string,
      ) => Promise<void>
    ).call(
      adapter,
      'jan@example.com',
      'Password reset',
      '<p>Hi Jan Novák</p><a href="https://kvintet.test/reset?token=abc">Reset</a>',
    );

    expect(log).not.toHaveBeenCalled();
    const output = warn.mock.calls.map((call) => String(call[0])).join('\n');
    expect(output).toContain('not sent');
    for (const secret of [
      'jan@example.com',
      'Password reset',
      'Jan Novák',
      'token=abc',
    ]) {
      expect(output).not.toContain(secret);
    }
  });
});
