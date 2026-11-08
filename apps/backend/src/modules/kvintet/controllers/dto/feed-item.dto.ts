import { MeetingFrequency } from '@/generated/prisma/client';

/** A member as the feed shows them: role and interests only, never a name. */
export class FeedMemberDto {
  position!: string | null;
  teach!: string[];
  learn!: string[];
  interests!: string[];
}

/** Why a kvintet suits the caller. The frontend translates the code; there is no score. */
export class FeedReasonDto {
  /** learn | teach | interest | topic | availability | frequency | roleMix */
  code!: string;
  /** Tag slug, for learn, teach and interest. */
  tag?: string;
  /** Category slug, for topic. */
  category?: string;
}

/** What every member of the kvintet picked: days and parts of the day, never a place. */
export class CommonAvailabilityDto {
  weekdays!: boolean;
  weekends!: boolean;
  mornings!: boolean;
  afternoons!: boolean;
  evenings!: boolean;
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
  commonAvailability!: CommonAvailabilityDto;
  members!: FeedMemberDto[];
  /** Up to three, strongest first. */
  reasons!: FeedReasonDto[];
}

export class FeedDto {
  /** Best match first. */
  items!: FeedItemDto[];
  /** True when no kvintet reached the match threshold, so every open one is listed. */
  fallback!: boolean;
}
