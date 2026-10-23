// Bump when the code of conduct text changes; stored with each user's consent.
export const CODE_OF_CONDUCT_VERSION = '1.0';

// Stamps the consent onto a new user, or returns null when the client did not
// send `acceptCodeOfConduct: true`. The client only sends the flag, never the
// timestamp or version (those fields are `input: false`).
export function withCodeOfConductConsent<T extends object>(
  user: T,
  body: unknown,
  now: Date = new Date(),
): {
  data: T & { codeOfConductAcceptedAt: Date; codeOfConductVersion: string };
} | null {
  const accepted =
    (body as { acceptCodeOfConduct?: unknown } | null | undefined)
      ?.acceptCodeOfConduct === true;
  if (!accepted) return null;
  return {
    data: {
      ...user,
      codeOfConductAcceptedAt: now,
      codeOfConductVersion: CODE_OF_CONDUCT_VERSION,
    },
  };
}
