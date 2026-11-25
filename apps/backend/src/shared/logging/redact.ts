// Story #177: e-mail addresses never reach the logs, which are shared across the course.
// Everything that logs an error or a third-party message goes through here.

// A real address: RFC 5322 "atext" characters in the local part (so `o'brien@` and `a+b@` match in
// full), Unicode letters allowed (IDN domains, `jürgen@bücher.de`), and a dotted domain ending in a
// letters-only TLD. Deliberately not "anything around an @": stack traces contain package paths such
// as `@prisma+client@7.9.1_@types+react/node_modules/...` whose "domain" is a version number, which
// has no letters-only TLD and so is left alone.
const EMAIL =
  /[\p{L}\p{N}\p{M}._%+\-'!#$&*/=?^`{|}~]+@(?:[\p{L}\p{N}\p{M}-]+\.)+\p{L}{2,}(?![\p{L}\p{N}\p{M}-])/gu;

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

/** better-auth's `logger.log`: writes each line to the console with e-mail addresses redacted. */
export const redactingAuthLog = (
  level: string,
  message: string,
  ...args: unknown[]
): void => {
  const line = redactedLogLine(message, args);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};
