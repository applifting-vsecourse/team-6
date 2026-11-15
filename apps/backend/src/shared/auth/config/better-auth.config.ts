import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions, BetterAuthPlugin } from 'better-auth/types';

export function resolveBetterAuthPlugins(nodeEnv?: string): BetterAuthPlugin[] {
  return [...(nodeEnv === 'production' ? [] : [openAPI()]), username()];
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
