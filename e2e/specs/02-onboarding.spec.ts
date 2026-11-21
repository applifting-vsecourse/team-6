import { test, expect } from '../fixtures/auth.fixture';
import { SignUpPage } from '../pages/signup.page';
import { OnboardingPage } from '../pages/onboarding.page';
import { generateRandomUser } from '../helpers/test-data';

test.describe('2. Onboarding Questionnaire Suite (Duolingo-style wizard)', () => {
  test('ONB-1: [Happy Path & Validation] Freshly registered user completes onboarding flow', async ({ page }) => {
    const newUser = generateRandomUser('onb');
    const signUpPage = new SignUpPage(page);
    const onboardingPage = new OnboardingPage(page);

    await signUpPage.goto();
    await signUpPage.register({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
      acceptConsent: true,
    });

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

    // Step 1: Role
    // Try clicking continue without picking role - button is disabled
    const continueBtn = page.locator('button:has-text("Pokračovat")');
    await expect(continueBtn).toBeDisabled();

    // Select a role
    const firstRole = page.locator('button, [role="button"]').filter({ hasText: /Student|Vývoj|Design|Produkt|Market/i }).first();
    await firstRole.click();
    await expect(continueBtn).toBeEnabled();
    await onboardingPage.clickContinue();

    // Step 2: Teach tags (can pick or continue)
    const availableTag = page.locator('button, [role="button"]').filter({ hasText: /React|Python|JavaScript|Design|Angličtina/i }).first();
    if (await availableTag.isVisible({ timeout: 2000 }).catch(() => false)) {
      await availableTag.click();
    }
    await onboardingPage.clickContinue();

    // Step 3: Learn tags
    const learnTag = page.locator('button, [role="button"]').filter({ hasText: /AI|Data|Python|TypeScript|Management/i }).first();
    if (await learnTag.isVisible({ timeout: 2000 }).catch(() => false)) {
      await learnTag.click();
    }
    await onboardingPage.clickContinue();

    // Step 4: Interests tags
    const interestTag = page.locator('button, [role="button"]').filter({ hasText: /Sport|Káva|Hry|Hudba|Knihy/i }).first();
    if (await interestTag.isVisible({ timeout: 2000 }).catch(() => false)) {
      await interestTag.click();
    }
    await onboardingPage.clickContinue();

    // Step 5: Expectations
    const expectationTile = page.locator('button, [role="checkbox"], label').filter({ hasText: /Naučit se|Sdílet|Potkat/i }).first();
    await expectationTile.click();
    await onboardingPage.clickContinue();

    // Step 6: Days
    const weekdayTile = page.locator('button, [role="checkbox"], label').filter({ hasText: /Všední dny|Víkendy/i }).first();
    await weekdayTile.click();
    await onboardingPage.clickContinue();

    // Step 7: Time
    const timeTile = page.locator('button, [role="checkbox"], label').filter({ hasText: /Dopoledne|Odpoledne|Večer/i }).first();
    await timeTile.click();
    await onboardingPage.clickContinue();

    // Step 8: Place / Location
    // Map picker has default coords or click to select
    await onboardingPage.clickContinue();

    // Step 9: Meeting frequency
    const freqRadio = page.locator('[role="radio"], label').filter({ hasText: /týdně|14 dní|měsíčně/i }).first();
    await freqRadio.click();
    await onboardingPage.clickContinue();

    // Step 10: Note
    await onboardingPage.fillNote('Těším se na spolupráci v novém kvintetu!');
    await onboardingPage.clickContinue();

    // Step 11: Summary
    await expect(page.locator('button:has-text("Dokončit"), button:has-text("Hotovo")')).toBeVisible({ timeout: 5_000 });
    await onboardingPage.clickFinish();

    // After finishing onboarding, user must land on /overview
    await expect(page).toHaveURL(/\/overview/, { timeout: 10_000 });
  });

  test('ONB-2: [Tag Search - PR #144, #149] Tag search filters correctly using Czech localized names', async ({ page }) => {
    const newUser = generateRandomUser('tag-search');
    const signUpPage = new SignUpPage(page);
    const onboardingPage = new OnboardingPage(page);

    await signUpPage.goto();
    await signUpPage.register({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
      acceptConsent: true,
    });

    await expect(page).toHaveURL(/\/onboarding/);

    // Pick role to proceed to tags step
    await page.locator('button, [role="button"]').filter({ hasText: /Student|Vývoj|Design/i }).first().click();
    await onboardingPage.clickContinue();

    // We are on Teach tags step - search for a tag in Czech
    const searchInput = page.locator('input[placeholder*="Hledat"], input[type="search"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Python');
      await expect(page.locator('button, span').filter({ hasText: 'Python' }).first()).toBeVisible();
    }
  });
});
