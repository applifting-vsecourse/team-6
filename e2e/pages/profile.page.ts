import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  readonly userNameHeading: Locator;
  readonly userEmail: Locator;
  readonly rolesList: Locator;
  readonly deleteAccountButton: Locator;
  readonly deleteDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.userNameHeading = page.locator('h1, h2').first();
    this.userEmail = page.locator(':has-text("@")');
    this.rolesList = page.locator('[class*="TagBadge"], [class*="badge"]');
    this.deleteAccountButton = page.locator('button:has-text("Smazat účet")');
    this.deleteDialog = page.locator('[role="dialog"]').filter({ hasText: /Smazat účet/ });
    this.confirmDeleteButton = page.locator('[role="dialog"] button:has-text("Smazat účet"), [role="dialog"] button.bg-destructive');
    this.cancelDeleteButton = page.locator('[role="dialog"] button:has-text("Zrušit")');
  }

  async goto() {
    await super.goto('/profile');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openDeleteDialog() {
    await this.deleteAccountButton.click();
    await expect(this.deleteDialog).toBeVisible();
  }

  async cancelDelete() {
    await this.cancelDeleteButton.click();
    await expect(this.deleteDialog).toBeHidden();
  }
}
