import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth/types';

export const betterAuthCoreConfig: BetterAuthOptions = {
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
  plugins: [openAPI(), username()],
};
