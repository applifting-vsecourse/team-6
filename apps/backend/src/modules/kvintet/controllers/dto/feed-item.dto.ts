import { MeetingFrequency } from '@/generated/prisma/client';

/** A member as the feed shows them: role and interests only, never a name. */
export class FeedMemberDto {
  position!: string | null;
  teach!: string[];
  learn!: string[];
  interests!: string[];
}

export class FeedItemDto {
  id!: string;
  title!: string;
  /** Category slugs, 1–3, in reference order. */
  categories!: string[];
  capacity!: number;
  memberCount!: number;
  /** Set only when every member picked the same meeting frequency. */
  meetingFrequency!: MeetingFrequency | null;
  members!: FeedMemberDto[];
}
