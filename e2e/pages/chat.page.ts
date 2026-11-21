import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ChatPage extends BasePage {
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messagesList: Locator;
  readonly emptyNotice: Locator;

  constructor(page: Page) {
    super(page);
    this.messageInput = page.locator('textarea[placeholder*="zprávu"], textarea[name="content"], input[placeholder*="zprávu"]');
    this.sendButton = page.locator('button:has-text("Odeslat"), button[aria-label*="Odeslat"]');
    this.messagesList = page.locator('[role="log"], .chat-messages, ul:has(li)');
    this.emptyNotice = page.locator(':has-text("Zatím žádné zprávy")');
  }

  async goto() {
    await super.goto('/kvintet/messages');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async expectMessage(contentPattern: string | RegExp) {
    const msg = this.page.locator('li, [class*="MessageItem"], div').filter({ hasText: contentPattern });
    await expect(msg.first()).toBeVisible({ timeout: 8_000 });
  }
}
