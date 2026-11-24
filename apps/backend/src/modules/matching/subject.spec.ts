import { exportToken, matchingSubject } from './subject';

describe('matchingSubject', () => {
  it('is stable for one user and secret, and differs by user and by secret', () => {
    const subject = matchingSubject('secret', 'user-1');
    expect(matchingSubject('secret', 'user-1')).toBe(subject);
    expect(matchingSubject('secret', 'user-2')).not.toBe(subject);
    expect(matchingSubject('other', 'user-1')).not.toBe(subject);
  });

  it('does not contain the user id', () => {
    expect(matchingSubject('secret', 'user-1')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('exportToken', () => {
  it('shortens a subject and leaves a missing one empty', () => {
    expect(exportToken('abcdef0123456789')).toBe('abcdef012345');
    expect(exportToken(null)).toBeNull();
  });
});
