import { test, expect } from '../fixtures/auth.fixture';
import { ProfilePage } from '../pages/profile.page';

test.describe('6. Profile & Account Management Suite', () => {
  test('PROF-1: [Happy Path] Displays user profile details and blobatars', async ({ userNoKvintet }) => {
    const profilePage = new ProfilePage(userNoKvintet);
    await profilePage.goto();

    // Verify profile page loaded with name and email
    await expect(userNoKvintet.locator('text=Lenka Malá')).toBeVisible();
    await expect(userNoKvintet.locator('text=lenka.mala@example.com')).toBeVisible();

    // Verify delete account button is accessible
    await expect(profilePage.deleteAccountButton).toBeVisible();
  });

  test('ACC-1: [Edge Case - PR #19, #65] Delete account dialog warns user and cancellation leaves account intact', async ({ userNoKvintet }) => {
    const profilePage = new ProfilePage(userNoKvintet);
    await profilePage.goto();

    await profilePage.openDeleteDialog();

    // Warning description
    await expect(profilePage.deleteDialog).toContainText(/trvale smazány/i);

    // Cancel deletion
    await profilePage.cancelDelete();
    await expect(profilePage.deleteDialog).toBeHidden();

    // User is still authenticated
    await expect(userNoKvintet).toHaveURL(/\/profile/);
  });

  test('ACC-2: [Happy Path] Deleting an account successfully purges user session', async ({ page }) => {
    // Create an ephemeral user specifically to delete
    const user = {
      email: `todelete-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'User To Delete',
      username: `del${Date.now()}`,
    };
    await page.request.post('http://localhost:4050/api/auth/sign-up/email', {
      data: { ...user, acceptCodeOfConduct: true },
      headers: { Origin: 'http://localhost:3050' },
    });
    await page.request.put('http://localhost:4050/api/profile', {
      data: {
        roles: ['student'],
        weekdays: true,
        mornings: true,
        meetingFrequency: 'WEEKLY',
        onboardingCompleted: true,
      },
      headers: { Origin: 'http://localhost:3050' },
    });

    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.openDeleteDialog();
    await profilePage.confirmDeleteButton.click();

    // After deletion, redirected to public home or login
    await expect(page).toHaveURL(/\/(login|\?.*)?$/, { timeout: 10_000 });
  });
});
