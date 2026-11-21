import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]').filter({ hasText: /Přihlásit se/ });
    this.errorMessage = page.locator('[role="alert"], .text-destructive');
    this.emailError = page.locator('p[id*="email-form-item-message"], p.text-destructive').filter({ hasText: /e-mail/i });
    this.passwordError = page.locator('p[id*="password-form-item-message"], p.text-destructive').filter({ hasText: /heslo/i });
    this.signUpLink = page.locator('a[href="/signup"]');
  }

  async goto() {
    await super.goto('/login');
    await expect(this.submitButton).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(pattern: string | RegExp) {
    await expect(this.errorMessage.filter({ hasText: pattern }).first()).toBeVisible({ timeout: 5_000 });
  }
}
