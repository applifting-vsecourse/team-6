import {
  distanceKm,
  emptyMatchProfile,
  MATCH_THRESHOLD,
  MATCH_WEIGHTS,
  scoreKvintet,
  type MatchProfile,
  type MatchReason,
  type MatchTag,
} from './matching';

const PRAHA = { latitude: 50.0755, longitude: 14.4378 };
const BRNO = { latitude: 49.1951, longitude: 16.6068 };

const profile = (overrides: Partial<MatchProfile> = {}): MatchProfile => ({
  ...emptyMatchProfile(),
  ...overrides,
});

const python = (kind: MatchTag['kind']): MatchTag => ({
  slug: 'python',
  kind,
  categories: ['software-development', 'data-ai'],
});
const figma = (kind: MatchTag['kind']): MatchTag => ({
  slug: 'figma',
  kind,
  categories: ['design-product'],
});
const hiking = (kind: MatchTag['kind']): MatchTag => ({
  slug: 'hiking',
  kind,
  categories: ['leisure'],
});

// Everything neutral: availability, distance, frequency, expectations and roles at 0.5.
const NEUTRAL_SCORE =
  0.5 *
  (MATCH_WEIGHTS.availability +
    MATCH_WEIGHTS.distance +
    MATCH_WEIGHTS.frequency +
    MATCH_WEIGHTS.expectations +
    MATCH_WEIGHTS.roles);

const score = (
  me: MatchProfile,
  members: MatchProfile[],
  categories = ['leisure'],
): number => scoreKvintet(me, { categories, members }).score;

describe('distanceKm', () => {
  it('measures Praha to Brno at about 185 km and a point to itself at 0', () => {
    expect(distanceKm(PRAHA, BRNO)).toBeGreaterThan(180);
    expect(distanceKm(PRAHA, BRNO)).toBeLessThan(190);
    expect(distanceKm(PRAHA, PRAHA)).toBe(0);
  });
});

describe('scoreKvintet', () => {
  it('weights sum to 100', () => {
    expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('scores missing data as neutral, below the threshold, with no reasons', () => {
    const result = scoreKvintet(profile(), {
      categories: ['leisure'],
      members: [profile()],
    });

    expect(result.score).toBeCloseTo(NEUTRAL_SCORE);
    expect(result.score).toBeLessThan(MATCH_THRESHOLD);
    expect(result.reasons).toEqual([]);
  });

  describe('topic fit', () => {
    it('counts LEARN and INTEREST fully and TEACH at half, taking the best category', () => {
      const members = [profile()];

      expect(
        score(profile({ tags: [python('LEARN')] }), members, ['data-ai']) -
          NEUTRAL_SCORE,
      ).toBeCloseTo(15);
      expect(
        score(profile({ tags: [python('TEACH')] }), members, ['data-ai']) -
          NEUTRAL_SCORE,
      ).toBeCloseTo(7.5);
      // A second category the caller has no tags in does not lower the fit.
      expect(
        score(profile({ tags: [python('LEARN')] }), members, [
          'business',
          'data-ai',
        ]) - NEUTRAL_SCORE,
      ).toBeCloseTo(15);
      expect(
        score(profile({ tags: [python('LEARN')] }), members, ['leisure']),
      ).toBeCloseTo(NEUTRAL_SCORE);
    });

    it('is full at two matching tags', () => {
      const me = profile({ tags: [python('LEARN'), python('INTEREST')] });

      expect(score(me, [profile()], ['data-ai']) - NEUTRAL_SCORE).toBeCloseTo(
        MATCH_WEIGHTS.topic,
      );
    });
  });

  describe('complementarity', () => {
    it('pairs my LEARN with their TEACH, my TEACH with their LEARN and shared interests, across members', () => {
      const me = profile({
        tags: [python('LEARN'), figma('TEACH'), hiking('INTEREST')],
      });
      const members = [
        profile({ tags: [python('TEACH')] }),
        profile({ tags: [figma('LEARN'), hiking('INTEREST')] }),
      ];

      const result = scoreKvintet(me, { categories: ['business'], members });

      // (1 + 0.75 + 0.5) / 3 of the complementarity weight.
      expect(result.score - NEUTRAL_SCORE).toBeCloseTo(
        0.75 * MATCH_WEIGHTS.complementarity,
      );
      expect(result.reasons).toEqual([
        { code: 'learn', tag: 'python' },
        { code: 'teach', tag: 'figma' },
        { code: 'interest', tag: 'hiking' },
      ]);
    });

    it('ignores the same tag in the same role on both sides', () => {
      const me = profile({ tags: [python('LEARN')] });

      expect(
        score(me, [profile({ tags: [python('LEARN')] })], ['business']),
      ).toBeCloseTo(NEUTRAL_SCORE);
    });
  });

  describe('availability', () => {
    const me = profile({ weekdays: true, evenings: true });

    it.each([
      [
        'the same days and part of the day',
        profile({ weekdays: true, evenings: true }),
        1,
      ],
      [
        'the same days, no part of the day picked',
        profile({ weekdays: true }),
        0.75,
      ],
      ['nothing in common', profile({ weekends: true, mornings: true }), 0],
    ])('scores %s', (_label, member, value) => {
      expect(score(me, [member])).toBeCloseTo(
        NEUTRAL_SCORE + MATCH_WEIGHTS.availability * (value - 0.5),
      );
    });

    it('gives the availability reason only on a full overlap', () => {
      const reasons = (member: MatchProfile): MatchReason[] =>
        scoreKvintet(me, { categories: [], members: [member] }).reasons;

      expect(reasons(profile({ weekdays: true, evenings: true }))).toEqual([
        { code: 'availability' },
      ]);
      expect(reasons(profile({ weekdays: true }))).toEqual([]);
    });
  });

  describe('distance', () => {
    const me = profile({ ...PRAHA, radiusKm: 20 });

    it('is best at the same place, using the smaller radius of the two', () => {
      const here = profile({ ...PRAHA, radiusKm: 50 });
      const brno = profile({ ...BRNO, radiusKm: 300 });

      expect(score(me, [here]) - NEUTRAL_SCORE).toBeCloseTo(
        MATCH_WEIGHTS.distance * 0.5,
      );
      // 185 km is beyond my 20 km even though Brno would travel 300 km.
      expect(score(me, [brno]) - NEUTRAL_SCORE).toBeCloseTo(
        -MATCH_WEIGHTS.distance * 0.5,
      );
    });

    it('never turns distance into a reason, so a member cannot be located by moving my own point', () => {
      for (const member of [
        profile({ ...PRAHA, radiusKm: 50 }),
        profile({ ...BRNO, radiusKm: 300 }),
      ]) {
        expect(
          scoreKvintet(me, { categories: [], members: [member] }).reasons,
        ).toEqual([]);
      }
    });

    it('leaves members without a location out of the mean', () => {
      const here = profile({ ...PRAHA, radiusKm: 50 });
      const result = scoreKvintet(me, {
        categories: [],
        members: [here, profile()],
      });

      expect(result.score - NEUTRAL_SCORE).toBeCloseTo(
        MATCH_WEIGHTS.distance * 0.5,
      );
      expect(result.reasons).toEqual([]);
    });
  });

  describe('frequency, expectations and roles', () => {
    it('scores the same frequency 1, a neighbour 0.5 and weekly against monthly 0', () => {
      const me = profile({ meetingFrequency: 'WEEKLY' });
      const at = (meetingFrequency: MatchProfile['meetingFrequency']): number =>
        score(me, [profile({ meetingFrequency })]) - NEUTRAL_SCORE;

      expect(at('WEEKLY')).toBeCloseTo(MATCH_WEIGHTS.frequency * 0.5);
      expect(at('BIWEEKLY')).toBeCloseTo(0);
      expect(at('MONTHLY')).toBeCloseTo(-MATCH_WEIGHTS.frequency * 0.5);
      expect(
        scoreKvintet(me, {
          categories: [],
          members: [profile({ meetingFrequency: 'WEEKLY' })],
        }).reasons,
      ).toEqual([{ code: 'frequency' }]);
    });

    it('scores expectations by overlap', () => {
      const me = profile({ expectations: ['learn_new', 'meet_people'] });

      // 1 shared of 3 distinct.
      expect(
        score(me, [profile({ expectations: ['learn_new', 'solve_problem'] })]) -
          NEUTRAL_SCORE,
      ).toBeCloseTo(MATCH_WEIGHTS.expectations * (1 / 3 - 0.5));
    });

    it('prefers members whose roles differ from mine', () => {
      const me = profile({ roles: ['developer'] });

      expect(
        score(me, [profile({ roles: ['designer'] })]) - NEUTRAL_SCORE,
      ).toBeCloseTo(MATCH_WEIGHTS.roles * 0.5);
      expect(
        score(me, [
          profile({ roles: ['designer'] }),
          profile({ roles: ['developer'] }),
        ]),
      ).toBeCloseTo(NEUTRAL_SCORE);
      expect(
        scoreKvintet(me, {
          categories: [],
          members: [profile({ roles: ['designer'] })],
        }).reasons,
      ).toEqual([{ code: 'roleMix' }]);
    });

    it('treats members without roles as unknown, not as a different role', () => {
      const me = profile({ roles: ['developer'] });

      // Nobody picked a role: neutral and no reason, not a perfect mix.
      const unknown = scoreKvintet(me, {
        categories: [],
        members: [profile(), profile()],
      });
      expect(unknown.score).toBeCloseTo(NEUTRAL_SCORE);
      expect(unknown.reasons).toEqual([]);
      // Only members with roles are compared: one designer, one unknown is a full mix.
      const mixed = scoreKvintet(me, {
        categories: [],
        members: [profile({ roles: ['designer'] }), profile()],
      });
      expect(mixed.score - NEUTRAL_SCORE).toBeCloseTo(
        MATCH_WEIGHTS.roles * 0.5,
      );
      expect(mixed.reasons).toEqual([{ code: 'roleMix' }]);
    });
  });

  it('ranks a topic and logistics match above a logistics-only one above an unrelated one', () => {
    const me = profile({
      tags: [python('LEARN')],
      roles: ['designer'],
      weekdays: true,
      evenings: true,
      ...PRAHA,
      radiusKm: 30,
      meetingFrequency: 'BIWEEKLY',
    });
    const neighbour = profile({
      weekdays: true,
      evenings: true,
      ...PRAHA,
      radiusKm: 30,
      meetingFrequency: 'BIWEEKLY',
    });
    const teacher = profile({
      ...neighbour,
      tags: [python('TEACH')],
      roles: ['developer'],
    });
    const stranger = profile({
      weekends: true,
      mornings: true,
      ...BRNO,
      radiusKm: 10,
      meetingFrequency: 'MONTHLY',
    });

    const ai = scoreKvintet(me, {
      categories: ['data-ai'],
      members: [teacher],
    });
    const local = scoreKvintet(me, {
      categories: ['leisure'],
      members: [neighbour],
    });
    const far = scoreKvintet(me, {
      categories: ['leisure'],
      members: [stranger],
    });

    expect(ai.score).toBeGreaterThan(local.score);
    expect(local.score).toBeGreaterThan(far.score);
    expect(ai.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(far.score).toBeLessThan(MATCH_THRESHOLD);
    // Strongest first: topic and availability (15 points each, topic listed first), then
    // the learnable tag, frequency and the role mix.
    expect(ai.reasons).toEqual([
      { code: 'topic', category: 'data-ai' },
      { code: 'availability' },
      { code: 'learn', tag: 'python' },
      { code: 'frequency' },
      { code: 'roleMix' },
    ]);
  });
});
