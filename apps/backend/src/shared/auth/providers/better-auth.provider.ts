import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { renderEmail } from '@/core/email/render';
import { ResetPassword } from '@/core/email/templates/reset-password';
import { VerifyEmail } from '@/core/email/templates/verify-email';
import { PrismaService } from '@/core/prisma/prisma.service';
import { betterAuthCoreConfig } from '@/shared/auth/config/better-auth.config';
import { codeOfConductDatabaseHooks } from '@/shared/auth/hooks/code-of-conduct.hook';
import { Config } from '@/shared/config/config.service';
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
    ...betterAuthCoreConfig,
    // Explicitly pass secret from config rather than relying on ambient process environment
    secret: config.betterAuthSecret,
    // Without this better-auth can only guess its own URL from the request,
    // which breaks callbacks and links built outside a request (e.g. the seed).
    baseURL: config.backendUrl,
    database: prismaAdapter(prismaService, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      ...betterAuthCoreConfig.emailAndPassword,
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
      ...betterAuthCoreConfig.user,
      additionalFields: {
        ...betterAuthCoreConfig.user?.additionalFields,
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
    plugins: (betterAuthCoreConfig.plugins ?? []).filter(
      (plugin) => config.nodeEnv !== 'production' || plugin.id !== 'open-api',
    ),
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
