import { AppModule } from '@/app.module';
import { setupApp } from '@/app.setup';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

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
  setupApp(app);

  await app.listen(0);
  return { app, baseUrl: await app.getUrl() };
}
