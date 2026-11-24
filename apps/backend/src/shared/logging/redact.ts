// Story #177: e-mail addresses never reach the logs, which are shared across the course.
// Everything that logs an error or a third-party message goes through here.

const EMAIL = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[^\s@<>()[\]"',;:]+/g;

export const REDACTED_EMAIL = '[redacted-email]';

/**
 * A placeholder that says roughly who an e-mail went to without being the address: `j***@example.com`.
 * Enough to tell two sends apart in a log, not enough to find the person.
 */
export const maskEmail = (email: string): string => {
  const at = email.lastIndexOf('@');
  if (at < 1) return REDACTED_EMAIL;
  return `${email[0]}***@${email.slice(at + 1)}`;
};

/** Replaces every e-mail address in the text. */
export const redactEmails = (text: string): string =>
  text.replace(EMAIL, REDACTED_EMAIL);

/** What to write to the log for a thrown value: its stack (or message), without e-mail addresses. */
export const redactedError = (error: unknown): string => {
  if (error instanceof Error) {
    return redactEmails(error.stack ?? `${error.name}: ${error.message}`);
  }
  if (typeof error === 'string') return redactEmails(error);
  try {
    return redactEmails(JSON.stringify(error) ?? String(error));
  } catch {
    return '[unserialisable error]';
  }
};

/** Redacts anything better-auth passes to its logger (messages and extra arguments). */
export const redactedLogLine = (message: string, args: unknown[]): string =>
  redactEmails(
    [message, ...args]
      .map((part) => (typeof part === 'string' ? part : redactedError(part)))
      .join(' '),
  );
