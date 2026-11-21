import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class OverviewPage extends BasePage {
  readonly greeting: Locator;
  readonly formingHeading: Locator;
  readonly kvintetTitle: Locator;
  readonly kvintetSeats: Locator;
  readonly voteButton: Locator;
  readonly leaveKvintetButton: Locator;
  readonly startOwnButton: Locator;
  readonly seeAllFeedButton: Locator;
  readonly chatLink: Locator;
  readonly sendIcebreakerButton: Locator;

  // Leave Dialog
  readonly leaveDialog: Locator;
  readonly leaveConfirmButton: Locator;
  readonly leaveCancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.greeting = page.locator('h1').first();
    this.formingHeading = page.locator('h1:has-text("Kvintet se skládá"), h1:has-text("Váš kvintet")');
    this.kvintetTitle = page.locator('h1 ~ p, .text-lead').first();
    this.kvintetSeats = page.locator('svg, [class*="RING_CLASS"], .relative.aspect-square').first();
    this.voteButton = page.locator('button:has-text("Hlasovat pro start"), button:has-text("Odvolat hlas")');
    this.leaveKvintetButton = page.locator('button:has-text("Opustit kvintet")');
    this.startOwnButton = page.locator('button:has-text("Založit vlastní"), button:has-text("Založit kvintet")');
    this.seeAllFeedButton = page.locator('a[href="/kvintet/feed"], a:has-text("Zobrazit všechny")');
    this.chatLink = page.locator('a[href="/kvintet/messages"], a:has-text("Přejít do chatu")');
    this.sendIcebreakerButton = page.locator('button:has-text("Poslat do chatu")');

    this.leaveDialog = page.locator('[role="dialog"]').filter({ hasText: /Opustit kvintet/ });
    this.leaveConfirmButton = page.locator('[role="dialog"] button:has-text("Opustit kvintet"), [role="dialog"] button.bg-destructive');
    this.leaveCancelButton = page.locator('[role="dialog"] button:has-text("Zůstat"), [role="dialog"] button:has-text("Zrušit")');
  }

  async goto() {
    await super.goto('/overview');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async voteToStart() {
    await this.voteButton.click();
  }

  async openLeaveDialog() {
    await this.leaveKvintetButton.click();
    await expect(this.leaveDialog).toBeVisible();
  }

  async confirmLeave() {
    await this.leaveConfirmButton.click();
    await expect(this.leaveDialog).toBeHidden({ timeout: 5_000 });
  }

  async cancelLeave() {
    await this.leaveCancelButton.click();
    await expect(this.leaveDialog).toBeHidden();
  }
}
