import { createHmac } from 'crypto';

/**
 * The key matching data is filed under instead of a user id (story #176). The same user always
 * gets the same subject, so their stays and feed loads can be followed, but without the secret
 * (which is not in the database) it cannot be traced back to an account, and the matching tables
 * have no relation to `user`.
 */
export const matchingSubject = (secret: string, userId: string): string =>
  createHmac('sha256', secret).update(`matching:${userId}`).digest('hex');

/** The short form that appears in CSV exports. */
export const exportToken = (subject: string | null): string | null =>
  subject ? subject.slice(0, 12) : null;
