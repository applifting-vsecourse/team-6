import {
  maskEmail,
  redactedError,
  redactedLogLine,
  redactEmails,
} from './redact';

describe('redactEmails', () => {
  it('replaces addresses wherever they appear', () => {
    expect(
      redactEmails('To: jan.novak+x@example.co.uk, cc <a@b.cz>; "c@d.io"'),
    ).toBe('To: [redacted-email], cc <[redacted-email]>; "[redacted-email]"');
  });

  it('leaves text without an address alone', () => {
    expect(redactEmails('Resend delivery failed (429)')).toBe(
      'Resend delivery failed (429)',
    );
  });
});

describe('maskEmail', () => {
  it('keeps the first letter and the domain, and nothing else', () => {
    expect(maskEmail('jan.novak@example.com')).toBe('j***@example.com');
  });

  it('does not echo something that is not an address', () => {
    expect(maskEmail('not-an-email')).toBe('[redacted-email]');
  });
});

describe('redactedError', () => {
  it('redacts the stack of an Error', () => {
    const error = new Error('Recipient address rejected: jan@example.com');
    const text = redactedError(error);
    expect(text).toContain('Recipient address rejected: [redacted-email]');
    expect(text).not.toContain('jan@example.com');
  });

  it('redacts strings and plain objects', () => {
    expect(redactedError('failed for jan@example.com')).not.toContain('jan@');
    expect(redactedError({ to: 'jan@example.com' })).not.toContain('jan@');
  });

  it('survives values that cannot be serialised', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(redactedError(circular)).toBe('[unserialisable error]');
  });
});

describe('redactedLogLine', () => {
  it('joins the message and arguments and redacts the lot', () => {
    const line = redactedLogLine('Failed for jan@example.com', [
      { email: 'jan@example.com' },
      'again jan@example.com',
    ]);
    expect(line).not.toContain('jan@example.com');
    expect(line).toContain('Failed for [redacted-email]');
  });
});
