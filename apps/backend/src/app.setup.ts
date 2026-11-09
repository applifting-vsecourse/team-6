import { INestApplication } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { BetterAuth } from './shared/auth/providers/better-auth.provider';
import { createValidationPipe } from './shared/errors/validation.pipe';

// HTTP wiring shared by main.ts and the integration tests, so the tests run
// the same pipeline as production. Order matters: BetterAuth must see the raw
// request body, so its handler is registered before the JSON parser.
export function setupApp(app: INestApplication): void {
  app.use(cookieParser());

  const appInstance = app.getHttpAdapter().getInstance();
  const betterAuth = app.get<BetterAuth>('BetterAuth');
  // Express 5 (via NestJS 11) requires named wildcards — a bare `*` throws.
  appInstance.all('/api/auth/*splat', toNodeHandler(betterAuth));
  appInstance.use(express.json());

  // Configure API prefix for all routes
  app.setGlobalPrefix('api');

  // Validation errors carry field + constraint codes the frontend translates
  app.useGlobalPipes(createValidationPipe());
}
