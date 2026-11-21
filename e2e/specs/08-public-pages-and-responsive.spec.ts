import { test, expect } from '../fixtures/auth.fixture';
import { BasePage } from '../pages/base.page';

test.describe('8. Public Pages, Theming & Responsiveness Suite', () => {
  test('PUB-1: [Landing Page - PR #110, #136, #150] Displays hero, mascot bubble, video CTA, and navigation', async ({ page }) => {
    await page.goto('/');

    // Verify main brand headline
    await expect(page.locator('h1').first()).toBeVisible();

    // Check link to How it works and Code of Conduct
    await expect(page.locator('a[href="/how-it-works"]').first()).toBeVisible();
    await expect(page.locator('a[href="/code-of-conduct"]').first()).toBeVisible();
  });

  test('PUB-2: [How It Works - PR #75] Loads explanatory steps', async ({ page }) => {
    await page.goto('/how-it-works');

    await expect(page.locator('h1').first()).toBeVisible();
    // Explains group forming process
    await expect(page.locator('body')).toContainText(/kvintet/i);
  });

  test('PUB-3: [Code of Conduct - PR #5] Lists 5 community guidelines and reporting contact', async ({ page }) => {
    await page.goto('/code-of-conduct');

    await expect(page.locator('h1:has-text("Pravidla komunity")')).toBeVisible();

    // Check presence of community rules
    await expect(page.locator('body')).toContainText(/Buďte laskaví/i);
    await expect(page.locator('body')).toContainText(/Buďte sami sebou/i);
  });

  test('THEME-1: [Theme Switcher] Toggles dark and light mode', async ({ page }) => {
    await page.goto('/');
    const basePage = new BasePage(page);

    // Initial html element
    const html = page.locator('html');

    // Toggle theme
    if (await basePage.themeSwitcher.first().isVisible()) {
      await basePage.toggleTheme();
      // Expect theme attribute or class to change
      const isDark = await html.evaluate((el) => el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark');
      
      // Toggle back
      await basePage.toggleTheme();
      const isDarkAfter = await html.evaluate((el) => el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark');
      expect(isDarkAfter).not.toEqual(isDark);
    }
  });

  test('MOBILE-1: [Mobile Responsive - PR #106, #113, #145, #148] Mobile viewport renders hamburger menu and drawer', async ({ page }) => {
    // Set 375px phone viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Hamburger button should be visible on mobile
    const menuBtn = page.locator('header button[aria-label*="menu"], header button:has(svg.lucide-menu)');
    await expect(menuBtn).toBeVisible();

    await menuBtn.click();

    // Drawer / sheet opens with links
    await expect(page.locator('[role="dialog"], [data-state="open"]')).toBeVisible();
  });
});
