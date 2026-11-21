import { test, expect } from '../fixtures/auth.fixture';
import { OverviewPage } from '../pages/overview.page';

test.describe('4. Proposal Voting & Leaving Suite', () => {
  test('VOTE-1: [Happy Path] Member of forming proposal sees members and can toggle vote to start', async ({ userProposalMember }) => {
    const overviewPage = new OverviewPage(userProposalMember);
    await overviewPage.goto();

    // Verify forming state is displayed
    await expect(overviewPage.formingHeading).toBeVisible();
    await expect(overviewPage.kvintetTitle).toBeVisible();

    // Verify seats circle exists
    await expect(overviewPage.kvintetSeats).toBeVisible();

    // Check voting button
    if (await overviewPage.voteButton.isVisible()) {
      const initialText = await overviewPage.voteButton.innerText();
      await overviewPage.voteToStart();

      // The button text should toggle between "Hlasovat pro start" and "Odvolat hlas"
      await expect(overviewPage.voteButton).not.toHaveText(initialText, { timeout: 6_000 });

      // Toggle back to preserve state for other runs
      await overviewPage.voteToStart();
      await expect(overviewPage.voteButton).toHaveText(initialText, { timeout: 6_000 });
    }
  });

  test('LEAVE-1: [Leave Dialog - PR #121, #124] Leave dialog warns member and allows cancellation', async ({ userProposalMember }) => {
    const overviewPage = new OverviewPage(userProposalMember);
    await overviewPage.goto();

    // Open leave dialog
    await overviewPage.openLeaveDialog();

    // Verify dialog explains the consequences
    await expect(overviewPage.leaveDialog).toBeVisible();
    await expect(overviewPage.leaveDialog).toContainText(/opustit|smazán/i);

    // Cancel leaving
    await overviewPage.cancelLeave();
    await expect(overviewPage.leaveDialog).toBeHidden();

    // Member is still in kvintet
    await expect(overviewPage.formingHeading).toBeVisible();
  });

  test('LEAVE-2: [Happy Path] Leaving a proposal removes membership and shows empty state', async ({ page }) => {
    // Create an isolated user who creates and then leaves a kvintet
    const user = {
      email: `leaver-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Kvintet Leaver',
      username: `leaver${Date.now()}`,
    };
    await page.request.post('http://localhost:4050/api/auth/sign-up/email', {
      data: { ...user, acceptCodeOfConduct: true },
      headers: { Origin: 'http://localhost:3050' },
    });
    await page.request.put('http://localhost:4050/api/profile', {
      data: {
        roles: ['freelancer'],
        weekdays: true,
        mornings: true,
        meetingFrequency: 'WEEKLY',
        onboardingCompleted: true,
      },
      headers: { Origin: 'http://localhost:3050' },
    });
    // Create kvintet
    await page.request.post('http://localhost:4050/api/kvintet', {
      data: {
        title: `Temp Proposal ${Date.now()}`,
        description: 'Temporary proposal created to test leaving kvintet flow.',
        categorySlugs: ['leisure'],
      },
      headers: { Origin: 'http://localhost:3050' },
    });

    const overviewPage = new OverviewPage(page);
    await overviewPage.goto();

    await expect(overviewPage.formingHeading).toBeVisible();

    // Leave the kvintet
    await overviewPage.openLeaveDialog();
    await overviewPage.confirmLeave();

    // Now overview should show the no-kvintet state with proposal feed
    await expect(page.locator('text=Opustili jste')).toBeVisible({ timeout: 6_000 });
  });
});
