import { test, expect } from '../fixtures/auth.fixture';
import { AdminPage } from '../pages/admin.page';

test.describe('7. Admin Dashboard & RBAC Suite (PR #112)', () => {
  test('ADMIN-1: [Security] Non-admin user cannot access admin dashboard', async ({ userNoKvintet }) => {
    await userNoKvintet.goto('/admin');

    // Should redirect away from /admin (to /login or /overview)
    await expect(userNoKvintet).not.toHaveURL(/\/admin$/);
  });

  test('ADMIN-2: [Happy Path] Superadmin accesses pilot overview statistics', async ({ userAdmin }) => {
    const adminPage = new AdminPage(userAdmin);
    await adminPage.goto();

    await expect(adminPage.heading).toBeVisible();

    // Verify statistical metric cards
    await expect(adminPage.registeredUsersCard).toBeVisible();
    await expect(adminPage.onboardedUsersCard).toBeVisible();
    await expect(adminPage.activeUsersTodayCard).toBeVisible();
    await expect(adminPage.kvintetsCard).toBeVisible();

    // Verify text explains privacy ("Jen součty. Žádná jména ani zprávy.")
    await expect(userAdmin.locator('text=Žádná jména ani zprávy')).toBeVisible();
  });
});
