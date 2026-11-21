import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPage extends BasePage {
  readonly heading: Locator;
  readonly registeredUsersCard: Locator;
  readonly onboardedUsersCard: Locator;
  readonly activeUsersTodayCard: Locator;
  readonly kvintetsCard: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1:has-text("Přehled pilotu")');
    this.registeredUsersCard = page.locator('.rounded-lg, div').filter({ hasText: /Registrovaní/ });
    this.onboardedUsersCard = page.locator('.rounded-lg, div').filter({ hasText: /Dokončili profil/ });
    this.activeUsersTodayCard = page.locator('.rounded-lg, div').filter({ hasText: /Dnes aktivní uživatelé/ });
    this.kvintetsCard = page.locator('.rounded-lg, div').filter({ hasText: /Kvintety/ });
  }

  async goto() {
    await super.goto('/admin');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
