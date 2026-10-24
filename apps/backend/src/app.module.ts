import { ConfigModule } from '@applifting-io/nestjs-decorated-config';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ChatModule } from './modules/chat/chat.module';
import { KvintetModule } from './modules/kvintet/kvintet.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { AuthModule } from './shared/auth/auth.module';
import { Config } from './shared/config/config.service';
import { AllExceptionsFilter } from './shared/errors/all-exceptions.filter';

const imports = [
  ConfigModule.forRootAsync(Config, { validate: true }),
  AuthModule,
  WelcomeModule,
  ReferenceModule,
  ProfileModule,
  KvintetModule,
  ChatModule,
];

@Module({
  imports,
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
