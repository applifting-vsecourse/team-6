import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SignUpPage extends BasePage {
  readonly emailInput: Locator;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly consentCheckbox: Locator;
  readonly codeOfConductLink: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  readonly consentError: Locator;
  readonly blobatarPreview: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.nameInput = page.locator('input[name="name"]');
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.confirmPasswordInput = page.locator('input[name="passwordConfirmation"]');
    this.consentCheckbox = page.locator('button[role="checkbox"], input[type="checkbox"][name="acceptCodeOfConduct"]');
    this.codeOfConductLink = page.locator('a[href="/code-of-conduct"], a:has-text("pravidly komunity")');
    this.submitButton = page.locator('button[type="submit"]').filter({ hasText: /Registrovat se/ });
    this.errorAlert = page.locator('[role="alert"]');
    this.emailError = page.locator('p[id*="email-form-item-message"]');
    this.passwordError = page.locator('p[id*="password-form-item-message"]');
    this.confirmPasswordError = page.locator('p[id*="passwordConfirmation-form-item-message"]');
    this.consentError = page.locator('p[id*="acceptCodeOfConduct-form-item-message"]');
    this.blobatarPreview = page.locator('svg[data-blobatar], .blobatar, svg[data-seed]');
  }

  async goto() {
    await super.goto('/signup');
    await expect(this.submitButton).toBeVisible();
  }

  async register(params: {
    email?: string;
    name?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    acceptConsent?: boolean;
  }) {
    if (params.email !== undefined) await this.emailInput.fill(params.email);
    if (params.name !== undefined) await this.nameInput.fill(params.name);
    if (params.username !== undefined) await this.usernameInput.fill(params.username);
    if (params.password !== undefined) await this.passwordInput.fill(params.password);
    if (params.confirmPassword !== undefined) await this.confirmPasswordInput.fill(params.confirmPassword);
    
    if (params.acceptConsent) {
      const isChecked = await this.consentCheckbox.getAttribute('aria-checked');
      if (isChecked !== 'true') {
        await this.consentCheckbox.click();
      }
    }
    await this.submitButton.click();
  }
}
