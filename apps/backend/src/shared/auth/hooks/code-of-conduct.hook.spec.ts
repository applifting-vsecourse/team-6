import { CODE_OF_CONDUCT_VERSION } from '@/shared/auth/code-of-conduct';
import { betterAuthCoreConfig } from '@/shared/auth/config/better-auth.config';
import { codeOfConductDatabaseHooks } from '@/shared/auth/hooks/code-of-conduct.hook';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

// Real BetterAuth with the app's core config and the consent hook, over an
// in-memory store, so sign-up goes through the same path as in production.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- the type is BetterAuth's generic Auth<...>, inferred from the options below
function createTestAuth() {
  const db: Record<string, unknown[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };
  const auth = betterAuth({
    baseURL: 'http://localhost:3000',
    secret: 'test-secret-test-secret-test-secret-123',
    database: memoryAdapter(db),
    ...betterAuthCoreConfig,
    databaseHooks: codeOfConductDatabaseHooks,
  });
  // Read lazily: the adapter may replace the array it was given.
  return {
    auth,
    users: (): Record<string, unknown>[] =>
      db.user as Record<string, unknown>[],
  };
}

const credentials = {
  email: 'jan@novak.cz',
  password: 'password1',
  name: 'Jan Novák',
};

// The flag is not part of BetterAuth's typed sign-up body, so it travels
// through a variable (skips the excess-property check), like the client does.
const signUp = (
  auth: ReturnType<typeof createTestAuth>['auth'],
  extra: Record<string, unknown> = {},
): ReturnType<typeof auth.api.signUpEmail> => {
  const body = { ...credentials, ...extra };
  return auth.api.signUpEmail({ body });
};

describe('code of conduct sign-up hook', () => {
  it('rejects a sign-up without the flag and stores no user', async () => {
    const { auth, users } = createTestAuth();

    await expect(signUp(auth)).rejects.toMatchObject({
      statusCode: 400,
      body: { code: 'CODE_OF_CONDUCT_REQUIRED' },
    });
    expect(users()).toHaveLength(0);
  });

  it('stores the server time and current version when the flag is set', async () => {
    const { auth, users } = createTestAuth();
    const before = Date.now();

    await signUp(auth, { acceptCodeOfConduct: true });

    expect(users()).toHaveLength(1);
    expect(users()[0]).toMatchObject({
      email: credentials.email,
      codeOfConductVersion: CODE_OF_CONDUCT_VERSION,
    });
    const acceptedAt = users()[0]?.codeOfConductAcceptedAt as Date;
    expect(acceptedAt).toBeInstanceOf(Date);
    expect(acceptedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('does not let the client set role, timestamp or version', async () => {
    const { auth, users } = createTestAuth();

    await signUp(auth, { acceptCodeOfConduct: true, role: 'admin' });
    expect(users()[0]).toMatchObject({ role: 'user' });

    await expect(
      signUp(auth, {
        email: 'other@novak.cz',
        acceptCodeOfConduct: true,
        codeOfConductAcceptedAt: '2000-01-01',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(users()).toHaveLength(1);
  });
});
