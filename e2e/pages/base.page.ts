import { expect, type Page, type Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly headerLogo: Locator;
  readonly userMenuTrigger: Locator;
  readonly themeSwitcher: Locator;
  readonly navOverview: Locator;
  readonly navFeed: Locator;
  readonly navProfile: Locator;
  readonly navAdmin: Locator;
  readonly mobileMenuTrigger: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerLogo = page.locator('header a[href="/"], header a[href="/overview"]').first();
    this.userMenuTrigger = page.locator('header button').filter({ hasText: /▾/ });
    this.themeSwitcher = page.locator('button[aria-label*="Motiv"], button[aria-label*="theme"], header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)');
    this.navOverview = page.locator('header nav a[href="/overview"], header nav a:has-text("Domů")');
    this.navFeed = page.locator('header nav a[href="/kvintet/feed"], header nav a:has-text("Kvintety")');
    this.navProfile = page.locator('a[href="/profile"], [role="menuitem"]:has-text("Profil")');
    this.navAdmin = page.locator('header nav a[href="/admin"], header nav a:has-text("Admin")');
    this.mobileMenuTrigger = page.locator('header button[aria-label*="menu"], header button:has(svg.lucide-menu)');
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async openUserMenu() {
    await this.userMenuTrigger.click();
    await this.page.waitForSelector('[role="menu"]', { state: 'visible' });
  }

  async signOut() {
    await this.openUserMenu();
    await this.page.locator('[role="menuitem"]').filter({ hasText: /Odhlásit se/ }).click();
    await this.page.waitForURL(/\/(login|\?.*)?$/, { timeout: 10_000 });
  }

  async expectToast(messagePattern: string | RegExp) {
    const toast = this.page.locator('[data-sonner-toast]').filter({ hasText: messagePattern });
    await expect(toast).toBeVisible({ timeout: 6_000 });
  }

  async toggleTheme() {
    await this.themeSwitcher.first().click();
  }
}
