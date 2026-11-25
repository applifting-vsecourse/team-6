/** The CSV files the admin can download to tune the matching weights (story #132). */
export enum ExportDataset {
  Feed = 'feed',
  Memberships = 'memberships',
  Kvintets = 'kvintets',
  Users = 'users',
}

export type FeedSnapshotRow = {
  id: number;
  userId: string | null;
  createdAt: Date;
  fallback: boolean;
  /** `[{ kvintetId, score }]` in feed order. */
  items: { kvintetId: string; score: number }[];
};

export type MembershipRow = {
  userId: string | null;
  kvintetId: string;
  source: string;
  joinedAt: Date;
  leftAt: Date | null;
  position: number | null;
  listSize: number | null;
  score: number | null;
};

export type KvintetLogRow = {
  kvintetId: string;
  createdAt: Date;
  activatedAt: Date | null;
  endedAt: Date | null;
};

export type OnboardedUserRow = {
  userId: string;
  onboardedAt: Date;
  firstJoinedAt: Date | null;
  /** Every feed load still kept, each as its kvintets' scores. */
  feedScores: number[][];
};
