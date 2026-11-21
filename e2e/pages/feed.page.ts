import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class FeedPage extends BasePage {
  readonly heading: Locator;
  readonly startKvintetButton: Locator;
  readonly categoryFilterTabs: Locator;
  readonly kvintetCards: Locator;

  // Start Kvintet Modal
  readonly startDialog: Locator;
  readonly dialogTitleInput: Locator;
  readonly dialogDescriptionInput: Locator;
  readonly dialogCategoryToggles: Locator;
  readonly dialogSubmitButton: Locator;
  readonly dialogCancelButton: Locator;
  readonly titleError: Locator;
  readonly descriptionError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('h1:has-text("Vyberte si kvintet")');
    this.startKvintetButton = page.locator('button:has-text("Založit kvintet"), button:has-text("Založit vlastní")').first();
    this.categoryFilterTabs = page.locator('[role="tab"], button[data-state]').filter({ hasText: /Podnikání|Data|Design|Jazyky|Vývoj/ });
    this.kvintetCards = page.locator('article, .rounded-lg.border:has(h2)');

    this.startDialog = page.locator('[role="dialog"]').filter({ hasText: /Založit kvintet/ });
    this.dialogTitleInput = page.locator('[role="dialog"] input[name="title"], [role="dialog"] input[placeholder*="název"]');
    this.dialogDescriptionInput = page.locator('[role="dialog"] textarea[name="description"]');
    this.dialogCategoryToggles = page.locator('[role="dialog"] [role="group"] button, [role="dialog"] button[data-state]');
    this.dialogSubmitButton = page.locator('[role="dialog"] button[type="submit"]:has-text("Založit")');
    this.dialogCancelButton = page.locator('[role="dialog"] button:has-text("Zrušit")');
    this.titleError = page.locator('[role="dialog"] p[id*="title-form-item-message"]');
    this.descriptionError = page.locator('[role="dialog"] p[id*="description-form-item-message"]');
  }

  async goto() {
    await super.goto('/kvintet/feed');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openStartDialog() {
    await this.startKvintetButton.click();
    await expect(this.startDialog).toBeVisible();
  }

  async selectDialogCategory(categoryNamePattern: string | RegExp) {
    const categoryButton = this.dialogCategoryToggles.filter({ hasText: categoryNamePattern }).first();
    await categoryButton.click();
  }

  async fillAndSubmitProposal(params: {
    title: string;
    description: string;
    categories?: (string | RegExp)[];
  }) {
    await this.dialogTitleInput.fill(params.title);
    if (params.categories) {
      for (const cat of params.categories) {
        await this.selectDialogCategory(cat);
      }
    }
    await this.dialogDescriptionInput.fill(params.description);
    await this.dialogSubmitButton.click();
  }

  async joinFirstAvailableProposal() {
    const joinButton = this.page.locator('button:has-text("Přidat se")').first();
    await expect(joinButton).toBeVisible();
    await joinButton.click();
  }
}
