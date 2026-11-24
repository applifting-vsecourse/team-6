import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import { ResetPassword } from '@/core/email/templates/reset-password';
import { VerifyEmail } from '@/core/email/templates/verify-email';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  betterAuthCoreConfig,
  resolveBetterAuthPlugins,
  resolveRateLimitEnabled,
} from '@/shared/auth/config/better-auth.config';
import { codeOfConductDatabaseHooks } from '@/shared/auth/hooks/code-of-conduct.hook';
import { Config } from '@/shared/config/config.service';
import { redactedLogLine } from '@/shared/logging/redact';
import { Inject, Provider } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const createAuth = (
  prismaService: PrismaService,
  config: Config,
  emailProvider: EmailService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  betterAuth({
    // Without this better-auth can only guess its own URL from the request,
    // which breaks callbacks and links built outside a request (e.g. the seed).
    baseURL: config.backendUrl,
    database: prismaAdapter(prismaService, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, token }) => {
        const passwordResetUrl = `${config.frontendUrl}/${config.frontendResetPasswordUrl}?token=${token}`;
        const html = await renderEmail(ResetPassword, {
          username: user.name,
          url: passwordResetUrl,
        });
        await emailProvider.sendEmail(user.email, 'Password reset', html);
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          input: false,
        },
      },
    },
    databaseHooks: codeOfConductDatabaseHooks,
    trustedOrigins: [config.frontendUrl],
    // better-auth logs failed sign-ups and sends with the user's input; keep e-mails out (#177).
    logger: {
      log: (level, message, ...args) => {
        const line = redactedLogLine(message, args);
        if (level === 'error') console.error(line);
        else if (level === 'warn') console.warn(line);
        else console.log(line);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const html = await renderEmail(VerifyEmail, { url });
        await emailProvider.sendEmail(
          user.email,
          'Verify your email address',
          html,
        );
      },
      sendOnSignUp: true,
    },
    // If change (setup) affects database, must be in core config, in order to be able to run migrations
    ...betterAuthCoreConfig,
    rateLimit: {
      ...betterAuthCoreConfig.rateLimit,
      enabled: resolveRateLimitEnabled(
        config.nodeEnv,
        config.disableRateLimit,
        betterAuthCoreConfig.rateLimit?.enabled,
      ),
    },
    plugins: resolveBetterAuthPlugins(config.nodeEnv),
  });

export type BetterAuth = ReturnType<typeof createAuth>;

export const betterAuthProvider: Provider = {
  provide: 'BetterAuth',
  useFactory: (
    prismaService: PrismaService,
    config: Config,
    emailProvider: EmailService,
  ) => createAuth(prismaService, config, emailProvider),
  inject: [PrismaService, Config, 'EmailService'],
};

export const InjectBetterAuth = Inject('BetterAuth');
