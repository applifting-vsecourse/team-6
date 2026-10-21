import { PrismaService } from '@/core/prisma/prisma.service';
import { CODE_OF_CONDUCT_VERSION } from '@/shared/auth/code-of-conduct';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './create-test-app';

// The verification mail renders through a dynamic import that Jest's VM rejects;
// the mail is not what these tests are about.
jest.mock('@/core/email/render', () => ({
  renderEmail: () => Promise.resolve(''),
}));

describe('auth against a real Postgres', () => {
  let app: INestApplication;
  let baseUrl: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, baseUrl } = await createTestApp());
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE "user" CASCADE`;
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = (extra: Record<string, unknown> = {}): Promise<Response> =>
    fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'jan@novak.cz',
        password: 'password1',
        name: 'Jan Novák',
        ...extra,
      }),
    });

  it('rejects a sign-up without consent and stores no user', async () => {
    const res = await signUp();

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      code: 'CODE_OF_CONDUCT_REQUIRED',
    });
    expect(await prisma.user.count()).toBe(0);
  });

  it('ignores role: "admin" and stamps consent with the server time and version', async () => {
    const before = Date.now();

    const res = await signUp({ acceptCodeOfConduct: true, role: 'admin' });

    expect(res.status).toBe(200);
    const user = await prisma.user.findFirstOrThrow();
    expect(user.role).toBe('user');
    expect(user.codeOfConductVersion).toBe(CODE_OF_CONDUCT_VERSION);
    expect(user.codeOfConductAcceptedAt?.getTime()).toBeGreaterThanOrEqual(
      before,
    );
  });

  it('rejects a sign-up that brings its own consent timestamp', async () => {
    const res = await signUp({
      acceptCodeOfConduct: true,
      codeOfConductAcceptedAt: '2000-01-01',
    });

    expect(res.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });
});
