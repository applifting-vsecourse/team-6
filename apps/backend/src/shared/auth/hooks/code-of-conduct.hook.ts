import { withCodeOfConductConsent } from '@/shared/auth/code-of-conduct';
import { APIError } from 'better-auth/api';
import { BetterAuthOptions } from 'better-auth/types';

// Server-side enforcement of the sign-up consent. `ctx.body` is the raw sign-up
// request, so the flag is readable here even though it is not a stored field.
// Runs on every user creation; email sign-up is the only path today. A future
// social login or invite flow must send the flag too, or be exempted here.
export const codeOfConductDatabaseHooks = {
  user: {
    create: {
      before: (user, ctx): Promise<{ data: object }> => {
        const consented = withCodeOfConductConsent(user, ctx?.body);
        if (!consented) {
          throw APIError.from('BAD_REQUEST', {
            code: 'CODE_OF_CONDUCT_REQUIRED',
            message: 'The code of conduct must be accepted',
          });
        }
        return Promise.resolve(consented);
      },
    },
  },
} satisfies NonNullable<BetterAuthOptions['databaseHooks']>;
