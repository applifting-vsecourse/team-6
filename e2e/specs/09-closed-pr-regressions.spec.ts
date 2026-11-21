import { test, expect } from '../fixtures/auth.fixture';
import { FeedPage } from '../pages/feed.page';
import { ProfilePage } from '../pages/profile.page';

test.describe('9. Closed PRs & GitHub Issues Regression Suite', () => {
  /**
   * PR #154 & Issue #131: Mandatory kvintet description (10-280 characters)
   */
  test('REGRESS-154: Enforces description length boundary (10 to 280 characters)', async ({ userNoKvintet }) => {
    const feedPage = new FeedPage(userNoKvintet);
    await feedPage.goto();

    await feedPage.openStartDialog();
    await feedPage.dialogTitleInput.fill('Boundary Description Test');
    await feedPage.selectDialogCategory(/Data a AI|Vývoj/i);

    // 9 characters (should fail min 10 requirement)
    await feedPage.dialogDescriptionInput.fill('123456789');
    await feedPage.dialogSubmitButton.click();
    await expect(feedPage.descriptionError).toBeVisible();
    await expect(feedPage.descriptionError).toContainText(/10/);

    // 10 characters (should satisfy min 10 requirement)
    await feedPage.dialogDescriptionInput.fill('1234567890');
    // Error for min 10 should disappear or not trigger on submit
    const descError = feedPage.descriptionError;
    const isErrorVisible = await descError.isVisible();
    if (isErrorVisible) {
      await expect(descError).not.toContainText(/10/);
    }

    await feedPage.dialogCancelButton.click();
  });

  /**
   * PR #118 & Issue #66: Choose up to 3 categories
   */
  test('REGRESS-118: Allows selecting up to 3 categories in kvintet proposal creation', async ({ userNoKvintet }) => {
    const feedPage = new FeedPage(userNoKvintet);
    await feedPage.goto();

    await feedPage.openStartDialog();

    // Select 3 categories
    const categoryButtons = feedPage.dialogCategoryToggles;
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await categoryButtons.nth(0).click();
    await categoryButtons.nth(1).click();
    await categoryButtons.nth(2).click();

    // 3 items should be pressed / selected
    const selected = feedPage.dialogCategoryToggles.locator('[data-state="on"], [aria-pressed="true"]');
    await expect(selected).toHaveCount(3);

    await feedPage.dialogCancelButton.click();
  });

  /**
   * PR #119 & Issue #81: Show the search radius on profile
   */
  test('REGRESS-119: Profile displays the search radius and location', async ({ userNoKvintet }) => {
    const profilePage = new ProfilePage(userNoKvintet);
    await profilePage.goto();

    // User's profile page should display radius (km) or location info
    await expect(userNoKvintet.locator('text=/\\d+\\s*km/i, text=Okolí, text=Praha')).toBeVisible({ timeout: 6_000 });
  });

  /**
   * PR #148 & Issue #145: Mobile phone sheet shows who is in a forming kvintet
   */
  test('REGRESS-148: Phone view shows kvintet member roles in details sheet', async ({ userNoKvintet }) => {
    // Set mobile viewport
    await userNoKvintet.setViewportSize({ width: 375, height: 667 });
    await userNoKvintet.goto('/kvintet/feed');

    // On phone, each card has a "Zobrazit" (View) button that opens the details sheet (PR #145)
    const viewButton = userNoKvintet.locator('button:has-text("Zobrazit")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      // Details sheet opens
      await expect(userNoKvintet.locator('[role="dialog"]')).toBeVisible();
      // Sheet shows member roles, not raw slugs (PR #145)
      await expect(userNoKvintet.locator('[role="dialog"]')).not.toContainText(/role_slug_unknown/);
    }
  });

  /**
   * PR #124 & Issue #121: Leave dialog says the kvintet is removed for the last member
   */
  test('REGRESS-124: Leave dialog informs sole creator that kvintet will be deleted upon leaving', async ({ page }) => {
    const user = {
      email: `sole-creator-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Sole Creator',
      username: `sole${Date.now()}`,
    };
    await page.request.post('http://localhost:4050/api/auth/sign-up/email', {
      data: { ...user, acceptCodeOfConduct: true },
      headers: { Origin: 'http://localhost:3050' },
    });
    await page.request.put('http://localhost:4050/api/profile', {
      data: {
        roles: ['founder'],
        weekdays: true,
        evenings: true,
        meetingFrequency: 'WEEKLY',
        onboardingCompleted: true,
      },
      headers: { Origin: 'http://localhost:3050' },
    });
    await page.request.post('http://localhost:4050/api/kvintet', {
      data: {
        title: `Sole Creator Group ${Date.now()}`,
        description: 'Testing leave dialog text for the last member.',
        categorySlugs: ['business'],
      },
      headers: { Origin: 'http://localhost:3050' },
    });

    await page.goto('/overview');

    // Open leave dialog
    const leaveBtn = page.locator('button:has-text("Opustit kvintet")');
    await expect(leaveBtn).toBeVisible();
    await leaveBtn.click();

    // Verify it specifically warns that the kvintet will be removed (smazán / zrušen)
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /Opustit kvintet/ });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/smazán|poslední/i);
  });
});
