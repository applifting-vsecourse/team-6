import type { MeetingFrequency } from '@/generated/prisma/client';

export const KVINTET_CAPACITY = 5;

/** What the feed may know about a member: no name, e-mail or user id. */
export type MemberProfile = {
  position: string | null;
  meetingFrequency: MeetingFrequency | null;
  teach: string[];
  learn: string[];
  interests: string[];
};

export type OpenKvintet = {
  id: string;
  title: string;
  category: string;
  members: MemberProfile[];
};

/** One kvintet as the feed lists it, ready for the response. */
export type FeedItem = {
  id: string;
  title: string;
  category: string;
  capacity: number;
  memberCount: number;
  /** Set only when every member picked the same meeting frequency. */
  meetingFrequency: MeetingFrequency | null;
  members: Pick<MemberProfile, 'position' | 'teach' | 'learn' | 'interests'>[];
};

export type NewKvintet = {
  title: string;
  categorySlug: string;
  description: string | null;
};

export type StartOutcome =
  | { result: 'started'; id: string }
  | { result: 'unknown_category' }
  | { result: 'already_member' };

export type JoinOutcome =
  'joined' | 'not_found' | 'not_open' | 'already_member';
