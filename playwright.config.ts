import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Kvintet E2E integration and regression tests.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e/specs',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker avoids database race conditions between integration tests
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'cs-CZ',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        isMobile: true,
      },
      // Only run mobile tests on the mobile project
      testMatch: /.*(responsive|mobile).*\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'pnpm backend start:dev',
      url: 'http://localhost:4050/api/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm frontend dev',
      url: 'http://localhost:3050',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
