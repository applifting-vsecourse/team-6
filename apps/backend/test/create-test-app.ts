import { AppModule } from '@/app.module';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { createValidationPipe } from '@/shared/errors/validation.pipe';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { toNodeHandler } from 'better-auth/node';
import * as express from 'express';

// Mirrors the wiring in src/main.ts (auth handler before the body parser,
// `api` prefix, validation pipe); keep the two in step.
export async function createTestApp(): Promise<{
  app: INestApplication;
  baseUrl: string;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('EmailService')
    .useValue({ sendEmail: () => Promise.resolve() })
    .compile();
  const app = moduleRef.createNestApplication();

  const instance = app.getHttpAdapter().getInstance();
  instance.all(
    '/api/auth/*splat',
    toNodeHandler(app.get<BetterAuth>('BetterAuth')),
  );
  instance.use(express.json());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());

  await app.listen(0);
  return { app, baseUrl: await app.getUrl() };
}
