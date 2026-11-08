import type { MessageKind } from '@/generated/prisma/client';

export const MESSAGE_MAX_LENGTH = 1000;
/** Last messages returned without a cursor, and the page size of `before`. */
export const MESSAGE_PAGE_SIZE = 50;
/** Upper bound of a page after `after=<id>`, so `after=0` cannot return the whole history. */
export const MESSAGE_POLL_LIMIT = 100;

/** Body of the SYSTEM line posted when a kvintet starts. A code, not text: the client translates it. */
export const KVINTET_STARTED = 'kvintet_started';

export type ChatMessage = {
  id: number;
  kind: MessageKind;
  /** NULL for SYSTEM lines and for authors who deleted their account. */
  authorId: string | null;
  authorName: string | null;
  authorUsername: string | null;
  body: string;
  createdAt: Date;
};

// message.id is a Postgres SERIAL: anything above would fail in the database as a 500.
export const MAX_MESSAGE_ID = 2_147_483_647;

export type ChatCursor = { after?: number; before?: number };

/** `active` is false while the kvintet is still forming: there is no chat to have unread messages in. */
export type UnreadState = { active: boolean; count: number };

/** Where the caller's kvintet stands; NULL means the caller is in none. */
export type ChatAccess = { kvintetId: string; active: boolean } | null;

export type SendOutcome =
  | { result: 'sent'; message: ChatMessage }
  | { result: 'not_member' }
  | { result: 'not_active' };
