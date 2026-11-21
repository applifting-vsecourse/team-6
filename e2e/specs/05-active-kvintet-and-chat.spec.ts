import { test, expect } from '../fixtures/auth.fixture';
import { OverviewPage } from '../pages/overview.page';
import { ChatPage } from '../pages/chat.page';

test.describe('5. Active Kvintet & Group Chat Suite', () => {
  test('ACTIVE-1: [Happy Path] Active kvintet reveals member names and shows chat entry', async ({ userActiveKvintet }) => {
    const overviewPage = new OverviewPage(userActiveKvintet);
    await overviewPage.goto();

    // Verify kvintet is active and shows members with real names
    await expect(userActiveKvintet.locator('text=Frontend craft circle')).toBeVisible();

    // Check that chat link or button exists
    await expect(overviewPage.chatLink).toBeVisible();
  });

  test('CHAT-1: [Happy Path] Sends a message in the active kvintet chat', async ({ userActiveKvintet }) => {
    const chatPage = new ChatPage(userActiveKvintet);
    await chatPage.goto();

    const testMessage = `Ahoj týme! Automatický test v ${Date.now()}`;
    await chatPage.sendMessage(testMessage);

    // Message should appear in chat
    await chatPage.expectMessage(testMessage);
  });

  test('CHAT-2: [Edge Case] Blank or whitespace-only messages cannot be sent', async ({ userActiveKvintet }) => {
    const chatPage = new ChatPage(userActiveKvintet);
    await chatPage.goto();

    // Empty input: button should be disabled
    await chatPage.messageInput.fill('   ');
    await expect(chatPage.sendButton).toBeDisabled();
  });

  test('CHAT-3: [Security] XSS payload is sanitized and rendered as literal text', async ({ userActiveKvintet }) => {
    const chatPage = new ChatPage(userActiveKvintet);
    await chatPage.goto();

    const xssPayload = `<img src="x" onerror="window.__xssRun=true" /> <script>window.__xssRun=true</script>`;
    await chatPage.sendMessage(xssPayload);

    // Message text is present in the DOM as safe text
    await chatPage.expectMessage(/<img src="x"/);

    // Verify JavaScript did not execute
    const xssExecuted = await userActiveKvintet.evaluate(() => (window as unknown as { __xssRun?: boolean }).__xssRun);
    expect(xssExecuted).toBeUndefined();
  });
});
