// Story #177: e-mail addresses never reach the logs, which are shared across the course.
// Everything that logs an error or a third-party message goes through here.

const EMAIL = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[^\s@<>()[\]"',;:]+/g;

export const REDACTED_EMAIL = '[redacted-email]';

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
