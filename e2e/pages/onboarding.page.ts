import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class OnboardingPage extends BasePage {
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly finishButton: Locator;
  readonly questionTitle: Locator;
  readonly stepIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.locator('button:has-text("Pokračovat")');
    this.backButton = page.locator('button:has-text("Zpět")');
    this.finishButton = page.locator('button:has-text("Dokončit"), button:has-text("Hotovo")');
    this.questionTitle = page.locator('h1, h2, [data-mascot-question]').first();
    this.stepIndicator = page.locator('header').filter({ hasText: /Krok|Step/ });
  }

  async goto() {
    await super.goto('/onboarding');
  }

  /**
   * Step: Role Selection
   * Selects roles like "Student", "Vývojář / vývojářka", etc.
   */
  async selectRole(roleNamePattern: string | RegExp) {
    const roleButton = this.page.locator('button, [role="button"]').filter({ hasText: roleNamePattern }).first();
    await roleButton.click();
  }

  /**
   * Step: Tag Selection (Teach, Learn, Interests)
   * Selects tags from list or uses search
   */
  async selectTag(tagNamePattern: string | RegExp) {
    const tagButton = this.page.locator('button, [role="button"]').filter({ hasText: tagNamePattern }).first();
    await tagButton.click();
  }

  async searchTag(query: string) {
    const searchInput = this.page.locator('input[placeholder*="Hledat"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
    }
  }

  /**
   * Step: Days & Times selection
   */
  async toggleChoiceTile(labelPattern: string | RegExp) {
    const tile = this.page.locator('button, div[role="checkbox"], label').filter({ hasText: labelPattern }).first();
    await tile.click();
  }

  /**
   * Step: Meeting frequency
   */
  async selectFrequency(frequencyPattern: string | RegExp) {
    const radio = this.page.locator('[role="radio"], label').filter({ hasText: frequencyPattern }).first();
    await radio.click();
  }

  /**
   * Step: Note
   */
  async fillNote(noteText: string) {
    const textarea = this.page.locator('textarea');
    await textarea.fill(noteText);
  }

  async clickContinue() {
    await this.continueButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickFinish() {
    await this.finishButton.click();
  }
}
