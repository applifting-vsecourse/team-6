import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions, BetterAuthPlugin } from 'better-auth/types';

export function resolveBetterAuthPlugins(nodeEnv?: string): BetterAuthPlugin[] {
  return [...(nodeEnv === 'production' ? [] : [openAPI()]), username()];
}

// Environments where the rate limit may be switched off. An allowlist, so a staging or preview
// deploy with some other NODE_ENV and the flag copied over still keeps the limit.
const RATE_LIMIT_OPT_OUT_ENVS = ['development', 'test'];

/**
 * Whether better-auth rate limits requests. `DISABLE_RATE_LIMIT=true` turns it off for the
 * Selenium suite (tests_selenium/), which signs in far more often than the sign-in limit allows;
 * it is honoured only in development and test.
 */
export function resolveRateLimitEnabled(
  nodeEnv: string | undefined,
  disableRateLimit: boolean,
  coreEnabled = true,
): boolean {
  const mayOptOut =
    nodeEnv !== undefined && RATE_LIMIT_OPT_OUT_ENVS.includes(nodeEnv);
  return mayOptOut && disableRateLimit ? false : coreEnabled;
}

export const betterAuthCoreConfig: BetterAuthOptions = {
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': {
        window: 60,
        max: 10,
      },
      '/sign-up/email': {
        window: 60,
        max: 5,
      },
    },
  },
  session: {
    // "Active today" in the admin stats counts sessions refreshed today, so refresh hourly (default: daily).
    // shortcut: misses a user who signed in and out again today, add user.lastActiveAt if the number has to be exact
    updateAge: 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false,
      },
      // Set by the sign-up hook in the provider, never by the client.
      codeOfConductAcceptedAt: {
        type: 'date',
        required: false,
        input: false,
      },
      codeOfConductVersion: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  plugins: resolveBetterAuthPlugins(process.env.NODE_ENV),
};
