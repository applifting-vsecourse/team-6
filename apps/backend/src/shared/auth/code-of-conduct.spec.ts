import {
  CODE_OF_CONDUCT_VERSION,
  withCodeOfConductConsent,
} from './code-of-conduct';

describe('withCodeOfConductConsent', () => {
  const user = { email: 'a@example.com' };
  const now = new Date('2026-10-18T10:00:00Z');

  it('stamps the server time and current version when consent is given', () => {
    expect(
      withCodeOfConductConsent(user, { acceptCodeOfConduct: true }, now),
    ).toEqual({
      data: {
        ...user,
        codeOfConductAcceptedAt: now,
        codeOfConductVersion: CODE_OF_CONDUCT_VERSION,
      },
    });
  });

  it.each([
    ['no body', undefined],
    ['no flag', {}],
    ['false', { acceptCodeOfConduct: false }],
    ['a truthy string', { acceptCodeOfConduct: 'true' }],
  ])('rejects sign-up with %s', (_name, body) => {
    expect(withCodeOfConductConsent(user, body, now)).toBeNull();
  });

  it('ignores a client-supplied timestamp or version in the body', () => {
    const result = withCodeOfConductConsent(
      user,
      {
        acceptCodeOfConduct: true,
        codeOfConductAcceptedAt: '2000-01-01',
        codeOfConductVersion: '0',
      },
      now,
    );
    expect(result?.data.codeOfConductAcceptedAt).toBe(now);
    expect(result?.data.codeOfConductVersion).toBe(CODE_OF_CONDUCT_VERSION);
  });
});
