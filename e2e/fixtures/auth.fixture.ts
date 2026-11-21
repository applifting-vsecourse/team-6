import { test as base, type Page } from '@playwright/test';
import { SEEDED_USERS } from '../helpers/test-data';
import { LoginPage } from '../pages/login.page';

export type AuthFixtures = {
  loginAs: (user: { email: string; password: string }) => Promise<void>;
  loginAsUI: (user: { email: string; password: string }) => Promise<void>;
  userNoKvintet: Page;
  userProposalMember: Page;
  userActiveKvintet: Page;
  userAdmin: Page;
};

/**
 * Fast API authentication that sets BetterAuth session cookie directly in browser context.
 */
async function authenticateViaApi(page: Page, email: string, password: string) {
  const response = await page.request.post('http://localhost:4050/api/auth/sign-in/email', {
    data: { email, password },
    headers: {
      Origin: 'http://localhost:3050',
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to authenticate ${email}: ${response.status()} ${await response.text()}`,
    );
  }
}

export const test = base.extend<AuthFixtures>({
  loginAs: async ({ page }, use) => {
    const fn = async (user: { email: string; password: string }) => {
      await authenticateViaApi(page, user.email, user.password);
    };
    await use(fn);
  },

  loginAsUI: async ({ page }, use) => {
    const fn = async (user: { email: string; password: string }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      await page.waitForURL(/\/overview|\/kvintet|\/onboarding|\/admin/, { timeout: 10_000 });
    };
    await use(fn);
  },

  // Fixture: Logged-in user who is onboarded and has NO kvintet
  userNoKvintet: async ({ page }, use) => {
    await authenticateViaApi(page, SEEDED_USERS.LENKA_MALA.email, SEEDED_USERS.LENKA_MALA.password);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await use(page);
  },

  // Fixture: Logged-in user who is in a forming proposal and can vote
  userProposalMember: async ({ page }, use) => {
    await authenticateViaApi(page, SEEDED_USERS.TOMAS_DVORAK.email, SEEDED_USERS.TOMAS_DVORAK.password);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await use(page);
  },

  // Fixture: Logged-in user who is in an active kvintet
  userActiveKvintet: async ({ page }, use) => {
    await authenticateViaApi(page, SEEDED_USERS.ANNA_HORAKOVA.email, SEEDED_USERS.ANNA_HORAKOVA.password);
    await page.goto('/overview', { waitUntil: 'domcontentloaded' });
    await use(page);
  },

  // Fixture: Logged-in admin user
  userAdmin: async ({ page }, use) => {
    await authenticateViaApi(page, SEEDED_USERS.ADMIN.email, SEEDED_USERS.ADMIN.password);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await use(page);
  },
});

export { expect } from '@playwright/test';
