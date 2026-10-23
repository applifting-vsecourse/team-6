import { MailModule } from '@/core/email/mail.module';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { Config } from '@/shared/config/config.service';
import { ConfigModule } from '@applifting-io/nestjs-decorated-config';
import { Module } from '@nestjs/common';
import { AuthenticatedUserGuard } from './guards/authenticated-user.guard';
import { MemberGuard } from './guards/member.guard';
import { OnboardedGuard } from './guards/onboarded.guard';
import { betterAuthProvider } from './providers/better-auth.provider';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRootAsync(Config, { validate: true }),
    MailModule,
  ],
  providers: [
    betterAuthProvider,
    AuthenticatedUserGuard,
    OnboardedGuard,
    MemberGuard,
  ],
  exports: [
    betterAuthProvider,
    AuthenticatedUserGuard,
    OnboardedGuard,
    MemberGuard,
    PrismaModule,
  ],
})
export class AuthModule {}
