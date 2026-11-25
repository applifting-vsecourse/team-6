import { Logger } from '@nestjs/common';
import { ResendAdapter } from './resend-adapter';

const send = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}));

describe('ResendAdapter', () => {
  const config = { apiKey: 're_test', from: 'Kvintet <no-reply@kvintet.test>' };
  const adapter = new ResendAdapter(config);
  let logged: jest.SpyInstance;

  beforeEach(() => {
    send.mockReset();
    logged = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends to the real address, only the logs are masked', async () => {
    send.mockResolvedValue({ error: null });

    await adapter.sendEmail('jan@example.com', 'Subject', '<p>Hi</p>');

    expect(send).toHaveBeenCalledWith({
      from: config.from,
      to: 'jan@example.com',
      subject: 'Subject',
      html: '<p>Hi</p>',
    });
    expect(logged).not.toHaveBeenCalled();
  });

  it('keeps the address out of the log line and the thrown error when the provider rejects it', async () => {
    send.mockResolvedValue({
      error: {
        name: 'validation_error',
        message: 'rejected jan@example.com: invalid recipient',
      },
    });

    const failure = await adapter
      .sendEmail('jan@example.com', 'Subject', '<p>Hi</p>')
      .then(
        () => null,
        (error: Error) => error,
      );

    expect(failure).toBeInstanceOf(Error);
    expect(failure?.message).toContain('rejected [redacted-email]');
    expect(failure?.message).not.toContain('jan@example.com');

    expect(logged).toHaveBeenCalledTimes(1);
    const line = String(logged.mock.calls[0][0]);
    expect(line).toContain('validation_error');
    // The recipient shows up only in masked form.
    expect(line).toContain('j***@example.com');
    expect(line).not.toContain('jan@example.com');
    expect(line.replace('j***@example.com', '')).not.toMatch(/@example\.com/);
  });
});
