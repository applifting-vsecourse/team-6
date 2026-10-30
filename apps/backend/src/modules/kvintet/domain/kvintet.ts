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
  categories: string[];
  members: MemberProfile[];
};

/** One kvintet as the feed lists it, ready for the response. */
export type FeedItem = {
  id: string;
  title: string;
  categories: string[];
  capacity: number;
  memberCount: number;
  /** Set only when every member picked the same meeting frequency. */
  meetingFrequency: MeetingFrequency | null;
  members: Pick<MemberProfile, 'position' | 'teach' | 'learn' | 'interests'>[];
};

export type NewKvintet = {
  title: string;
  categorySlugs: string[];
  description: string | null;
};

export type StartOutcome =
  | { result: 'started'; id: string }
  | { result: 'unknown_category' }
  | { result: 'already_member' };

export type JoinOutcome =
  'joined' | 'not_found' | 'not_open' | 'already_member';

export type KvintetStatusType = 'FORMING' | 'ACTIVE';

export interface KvintetMemberDetails {
  userId: string;
  name: string | null;
  /** Avatar seed; hidden like `name` until the kvintet is ACTIVE. */
  username: string | null;
  role: string | null;
  teachTags: string[];
  learnTags: string[];
  interestTags: string[];
  hasVoted: boolean;
  isCurrentUser: boolean;
}

export interface KvintetVoteStatus {
  canVote: boolean;
  userHasVoted: boolean;
  votedCount: number;
  totalCount: number;
}

export interface CommonPreferences {
  city: string | null;
  meetingFrequency: MeetingFrequency | null;
  weekdays: boolean;
  weekends: boolean;
  mornings: boolean;
  afternoons: boolean;
  evenings: boolean;
}

export interface KvintetDetails {
  id: string;
  title: string;
  status: KvintetStatusType;
  createdAt: Date;
  activatedAt: Date | null;
  commonPreferences: CommonPreferences | null;
  capacity: number;
  openSeatsCount: number;
  members: KvintetMemberDetails[];
  voteStatus: KvintetVoteStatus;
}
