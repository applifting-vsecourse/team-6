export enum MeetingFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum TagKind {
  TEACH = 'TEACH',
  LEARN = 'LEARN',
  INTEREST = 'INTEREST',
}

export class ProfileTagEntity {
  constructor(
    public readonly tagId: string,
    public readonly slug: string,
    public readonly kind: TagKind,
  ) {}
}

export interface SaveProfileData {
  position?: string;
  roles?: string[];
  teachTagIds: string[];
  learnTagIds: string[];
  interestTagIds: string[];
  weekdays: boolean;
  weekends: boolean;
  mornings: boolean;
  afternoons: boolean;
  evenings: boolean;
  cityId?: string | null;
  radiusKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  expectations?: string[];
  meetingFrequency?: MeetingFrequency;
  note?: string;
  completeOnboarding?: boolean;
}

export class ProfileEntity {
  constructor(
    public readonly userId: string,
    public readonly position: string | null,
    public readonly expectations: string[] | null,
    public readonly meetingFrequency: MeetingFrequency | null,
    public readonly weekdays: boolean,
    public readonly weekends: boolean,
    public readonly mornings: boolean,
    public readonly afternoons: boolean,
    public readonly evenings: boolean,
    public readonly cityId: string | null,
    public readonly cityName: string | null,
    public readonly radiusKm: number | null,
    public readonly note: string | null,
    public readonly onboardingCompletedAt: Date | null,
    public readonly tags: ProfileTagEntity[],
    public readonly roles: string[] = [],
    public readonly latitude: number | null = null,
    public readonly longitude: number | null = null,
  ) {}
}
