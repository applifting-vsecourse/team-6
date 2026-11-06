import type {
  MeetingFrequency,
  ProfileTagKind,
} from '@/generated/prisma/client';

// Pure scoring for the kvintet feed: no database, no Nest. See docs/ARCHITECTURE.md (Matching).

export type MatchTag = {
  slug: string;
  kind: ProfileTagKind;
  /** Category slugs the tag counts towards (tag_category). */
  categories: string[];
};

export type MatchProfile = {
  tags: MatchTag[];
  roles: string[];
  weekdays: boolean;
  weekends: boolean;
  mornings: boolean;
  afternoons: boolean;
  evenings: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number | null;
  meetingFrequency: MeetingFrequency | null;
  expectations: string[];
};

/** A profile with nothing filled in: every criterion scores it as neutral. */
export const emptyMatchProfile = (): MatchProfile => ({
  tags: [],
  roles: [],
  weekdays: false,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: false,
  latitude: null,
  longitude: null,
  radiusKm: null,
  meetingFrequency: null,
  expectations: [],
});

export type MatchKvintet = {
  categories: string[];
  members: MatchProfile[];
};

/** Why a kvintet suits the caller: stable codes the frontend translates, never a score. */
export type MatchReason =
  | { code: 'learn' | 'teach' | 'interest'; tag: string }
  | { code: 'topic'; category: string }
  // No distance reason: a yes/no "nearby" lets a caller locate a member by moving their own point.
  | { code: 'availability' | 'frequency' | 'roleMix' };

export type MatchResult = { score: number; reasons: MatchReason[] };

/** Points per criterion; they sum to 100. Tune from pilot data. */
export const MATCH_WEIGHTS = {
  topic: 30,
  complementarity: 25,
  availability: 15,
  distance: 10,
  frequency: 8,
  expectations: 6,
  roles: 6,
} as const;

/** The feed hides kvintets scoring below this, unless none reach it. */
export const MATCH_THRESHOLD = 30;

/** Score for a criterion one side has no data for: neither helps nor hurts. */
const NEUTRAL = 0.5;

const TOPIC_KIND_WEIGHT: Record<ProfileTagKind, number> = {
  LEARN: 1,
  INTEREST: 1,
  TEACH: 0.5,
};
/** Weighted tags at which topic fit is full. */
const TOPIC_SATURATION = 2;

const PAIR_WEIGHT = { learn: 1, teach: 0.75, interest: 0.5 } as const;
/** Weighted tag matches at which complementarity is full. */
const COMPLEMENTARITY_SATURATION = 3;

const FREQUENCY_ORDER: MeetingFrequency[] = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];

const EARTH_RADIUS_KM = 6371;

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const rad = (degrees: number): number => (degrees * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const slugs = (profile: MatchProfile, kind: ProfileTagKind): Set<string> =>
  new Set(profile.tags.filter((tag) => tag.kind === kind).map((t) => t.slug));

const union = (sets: Set<string>[]): Set<string> =>
  new Set(sets.flatMap((set) => [...set]));

const intersect = (a: Set<string>, b: Set<string>): string[] =>
  [...a].filter((item) => b.has(item));

const mean = (values: number[]): number =>
  values.length === 0
    ? NEUTRAL
    : values.reduce((sum, value) => sum + value, 0) / values.length;

/** The caller's tags that count towards the best-fitting of the kvintet's categories. */
function topic(
  me: MatchProfile,
  categories: string[],
): { value: number; category: string | null } {
  let best = { value: 0, category: null as string | null };
  for (const category of categories) {
    const weight = me.tags
      .filter((tag) => tag.categories.includes(category))
      .reduce((sum, tag) => sum + TOPIC_KIND_WEIGHT[tag.kind], 0);
    const value = Math.min(1, weight / TOPIC_SATURATION);
    if (value > best.value) best = { value, category };
  }
  return best;
}

/** A tag counts when any member covers it. */
function complementarity(
  me: MatchProfile,
  members: MatchProfile[],
): { value: number; learn: string[]; teach: string[]; interest: string[] } {
  const learn = intersect(
    slugs(me, 'LEARN'),
    union(members.map((m) => slugs(m, 'TEACH'))),
  );
  const teach = intersect(
    slugs(me, 'TEACH'),
    union(members.map((m) => slugs(m, 'LEARN'))),
  );
  const interest = intersect(
    slugs(me, 'INTEREST'),
    union(members.map((m) => slugs(m, 'INTEREST'))),
  );
  const weighted =
    PAIR_WEIGHT.learn * learn.length +
    PAIR_WEIGHT.teach * teach.length +
    PAIR_WEIGHT.interest * interest.length;
  return {
    value: Math.min(1, weighted / COMPLEMENTARITY_SATURATION),
    learn,
    teach,
    interest,
  };
}

/** Half for days, half for parts of the day; a side with nothing picked is neutral. */
function availability(me: MatchProfile, member: MatchProfile): number {
  const half = (mine: boolean[], theirs: boolean[]): number => {
    if (!mine.some(Boolean) || !theirs.some(Boolean)) return NEUTRAL;
    return mine.some((picked, i) => picked && theirs[i]) ? 1 : 0;
  };
  const days = (p: MatchProfile): boolean[] => [p.weekdays, p.weekends];
  const parts = (p: MatchProfile): boolean[] => [
    p.mornings,
    p.afternoons,
    p.evenings,
  ];
  return (
    0.5 * half(days(me), days(member)) + 0.5 * half(parts(me), parts(member))
  );
}

/** Soft: closer is better within the smaller of the two radii, 0 beyond it. */
function distance(me: MatchProfile, member: MatchProfile): number | null {
  if (
    me.latitude === null ||
    me.longitude === null ||
    me.radiusKm === null ||
    member.latitude === null ||
    member.longitude === null ||
    member.radiusKm === null
  ) {
    return null;
  }
  const km = distanceKm(
    { latitude: me.latitude, longitude: me.longitude },
    { latitude: member.latitude, longitude: member.longitude },
  );
  const limit = Math.min(me.radiusKm, member.radiusKm);
  return km <= limit ? 1 - km / (2 * limit) : 0;
}

function frequency(me: MatchProfile, member: MatchProfile): number {
  if (!me.meetingFrequency || !member.meetingFrequency) return NEUTRAL;
  const gap = Math.abs(
    FREQUENCY_ORDER.indexOf(me.meetingFrequency) -
      FREQUENCY_ORDER.indexOf(member.meetingFrequency),
  );
  return gap === 0 ? 1 : gap === 1 ? 0.5 : 0;
}

function expectations(me: MatchProfile, member: MatchProfile): number {
  if (me.expectations.length === 0 || member.expectations.length === 0) {
    return NEUTRAL;
  }
  const mine = new Set(me.expectations);
  const shared = member.expectations.filter((e) => mine.has(e)).length;
  return shared / new Set([...me.expectations, ...member.expectations]).size;
}

/**
 * A mix of roles is the point: members who share none of the caller's roles count.
 * Only members who picked roles are compared; with none on either side it is neutral.
 */
function roles(me: MatchProfile, members: MatchProfile[]): number {
  const known = members.filter((m) => m.roles.length > 0);
  if (me.roles.length === 0 || known.length === 0) return NEUTRAL;
  const sharing = known.filter((m) =>
    m.roles.some((role) => me.roles.includes(role)),
  ).length;
  return 1 - sharing / known.length;
}

export function scoreKvintet(
  me: MatchProfile,
  kvintet: MatchKvintet,
): MatchResult {
  const { members } = kvintet;
  const fit = topic(me, kvintet.categories);
  const pairs = complementarity(me, members);
  const timeFit = mean(members.map((m) => availability(me, m)));
  const distances = members
    .map((m) => distance(me, m))
    .filter((d): d is number => d !== null);
  const closeness = mean(distances);
  const frequencies = members.map((m) => frequency(me, m));
  const roleMix = roles(me, members);

  const score =
    MATCH_WEIGHTS.topic * fit.value +
    MATCH_WEIGHTS.complementarity * pairs.value +
    MATCH_WEIGHTS.availability * timeFit +
    MATCH_WEIGHTS.distance * closeness +
    MATCH_WEIGHTS.frequency * mean(frequencies) +
    MATCH_WEIGHTS.expectations * mean(members.map((m) => expectations(me, m))) +
    MATCH_WEIGHTS.roles * roleMix;

  // Each reason carries the points it stands for, so the strongest come first.
  const perPair = MATCH_WEIGHTS.complementarity / COMPLEMENTARITY_SATURATION;
  const weighted: { points: number; reason: MatchReason }[] = [
    ...pairs.learn.map((tag) => ({
      points: perPair * PAIR_WEIGHT.learn,
      reason: { code: 'learn' as const, tag },
    })),
    ...pairs.teach.map((tag) => ({
      points: perPair * PAIR_WEIGHT.teach,
      reason: { code: 'teach' as const, tag },
    })),
    ...pairs.interest.map((tag) => ({
      points: perPair * PAIR_WEIGHT.interest,
      reason: { code: 'interest' as const, tag },
    })),
  ];
  if (fit.category) {
    weighted.push({
      points: MATCH_WEIGHTS.topic * fit.value,
      reason: { code: 'topic', category: fit.category },
    });
  }
  if (timeFit === 1) {
    weighted.push({
      points: MATCH_WEIGHTS.availability,
      reason: { code: 'availability' },
    });
  }
  if (frequencies.length > 0 && frequencies.every((f) => f === 1)) {
    weighted.push({
      points: MATCH_WEIGHTS.frequency,
      reason: { code: 'frequency' },
    });
  }
  if (me.roles.length > 0 && roleMix === 1) {
    weighted.push({ points: MATCH_WEIGHTS.roles, reason: { code: 'roleMix' } });
  }

  return {
    score,
    // Stable sort: equal points keep the order above.
    reasons: weighted
      .sort((a, b) => b.points - a.points)
      .map(({ reason }) => reason),
  };
}
