import { PrismaService } from '@/core/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { BetterAuthOptions } from 'better-auth/types';

const logger = new Logger('SessionPurge');

// Sessions hold an IP address and a user agent. There is no cron, so every sign-in deletes the
// ones that have expired, instead of keeping them forever.
export const sessionPurgeDatabaseHooks = (
  prisma: PrismaService,
): NonNullable<BetterAuthOptions['databaseHooks']> => ({
  session: {
    create: {
      after: async (): Promise<void> => {
        try {
          await prisma.session.deleteMany({
            where: { expiresAt: { lt: new Date() } },
          });
        } catch {
          // Signing in must not fail because the clean-up did.
          logger.warn('Could not delete expired sessions');
        }
      },
    },
  },
});
