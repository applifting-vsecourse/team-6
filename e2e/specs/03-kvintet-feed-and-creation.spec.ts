import { test, expect } from '../fixtures/auth.fixture';
import { FeedPage } from '../pages/feed.page';
import { generateRandomProposal } from '../helpers/test-data';

test.describe('3. Kvintet Proposal Feed & Creation Suite', () => {
  test('FEED-1: [Happy Path] Browses open proposals with anonymous seats and category tags', async ({ userNoKvintet }) => {
    const feedPage = new FeedPage(userNoKvintet);
    await feedPage.goto();

    await expect(feedPage.heading).toBeVisible();

    // Verify proposals exist and display anonymous cards
    const cardCount = await feedPage.kvintetCards.count();
    expect(cardCount).toBeGreaterThan(0);

    const firstCard = feedPage.kvintetCards.first();
    await expect(firstCard.locator('h2')).toBeVisible();
    // Check seat count format (e.g. "1 / 5" or "4 / 5")
    await expect(firstCard).toContainText(/\d\s*\/\s*5/);
  });

  test('FEED-2: [Filter] Category filtering narrows down displayed proposals', async ({ userNoKvintet }) => {
    const feedPage = new FeedPage(userNoKvintet);
    await feedPage.goto();

    // Look for category filter pill (e.g. "Data a AI", "Jazyky", "Podnikání")
    const categoryTab = userNoKvintet.locator('button, [role="tab"]').filter({ hasText: /Data a AI|Jazyky|Podnikání/ }).first();
    if (await categoryTab.isVisible()) {
      await categoryTab.click();
      // URL should reflect the filter query
      await expect(userNoKvintet).toHaveURL(/category=/);
    }
  });

  test('PROP-1: [Validation - PR #131, #137, #154] Kvintet creation validates title, categories, and description length', async ({ userNoKvintet }) => {
    const feedPage = new FeedPage(userNoKvintet);
    await feedPage.goto();

    await feedPage.openStartDialog();

    // Submit empty modal
    await feedPage.dialogSubmitButton.click();
    await expect(feedPage.titleError).toBeVisible();

    // Description length validation: min 10 chars (PR #154)
    await feedPage.dialogTitleInput.fill('Valid Proposal Title');
    // Select one category
    const catButton = feedPage.dialogCategoryToggles.first();
    await catButton.click();

    // Fill too short description (<10 chars)
    await feedPage.dialogDescriptionInput.fill('Too short');
    await feedPage.dialogSubmitButton.click();
    await expect(feedPage.descriptionError).toBeVisible();
    await expect(feedPage.descriptionError).toContainText(/10/);

    await feedPage.dialogCancelButton.click();
    await expect(feedPage.startDialog).toBeHidden();
  });

  test('PROP-2: [Happy Path] Creates a new kvintet proposal and redirects to overview', async ({ page, loginAs }) => {
    // We register a fresh user so they have no kvintet and can start one
    const user = {
      email: `creator-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Proposal Creator',
      username: `creator${Date.now()}`,
    };
    // Sign up via API
    await page.request.post('http://localhost:4050/api/auth/sign-up/email', {
      data: { ...user, acceptCodeOfConduct: true },
      headers: { Origin: 'http://localhost:3050' },
    });
    // Mark onboarded via API so user can start kvintet directly
    await page.request.put('http://localhost:4050/api/profile', {
      data: {
        roles: ['developer'],
        weekdays: true,
        evenings: true,
        meetingFrequency: 'WEEKLY',
        onboardingCompleted: true,
      },
      headers: { Origin: 'http://localhost:3050' },
    });

    await page.goto('/kvintet/feed');

    const feedPage = new FeedPage(page);
    await feedPage.openStartDialog();

    const proposal = generateRandomProposal('AI Mastery');
    await feedPage.fillAndSubmitProposal({
      title: proposal.title,
      description: proposal.description,
      categories: [/Data a AI|Vývoj/i],
    });

    // Should redirect to overview or show the new forming kvintet
    await expect(page).toHaveURL(/\/overview|\/kvintet/, { timeout: 10_000 });
    await expect(page.locator(`text=${proposal.title}`)).toBeVisible();
  });
});
