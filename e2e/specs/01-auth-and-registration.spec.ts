import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';
import { SignUpPage } from '../pages/signup.page';
import { generateRandomUser, SEEDED_USERS } from '../helpers/test-data';

test.describe('1. Authentication & Registration Suite', () => {
  test('REG-1: [Happy Path] Registers a new user with code of conduct consent and proceeds to onboarding', async ({ page }) => {
    const newUser = generateRandomUser('reg-happy');
    const signUpPage = new SignUpPage(page);

    await signUpPage.goto();

    // Verify blobatar preview reacts to username
    await signUpPage.usernameInput.fill(newUser.username);
    await expect(signUpPage.blobatarPreview.first()).toBeVisible();

    await signUpPage.register({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
      acceptConsent: true,
    });

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
  });

  test('REG-2: [Edge Case] Registration cannot be submitted without Code of Conduct consent', async ({ page }) => {
    const newUser = generateRandomUser('reg-noconsent');
    const signUpPage = new SignUpPage(page);

    await signUpPage.goto();
    await signUpPage.register({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
      acceptConsent: false, // Consent is deliberately not checked
    });

    // Form remains on signup page and shows validation error
    await expect(page).toHaveURL(/\/signup/);
    await expect(signUpPage.consentError).toBeVisible();
    await expect(signUpPage.consentError).toContainText(/pravidly/i);
  });

  test('REG-3: [Edge Case] Code of Conduct link opens the guidelines page', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    await expect(signUpPage.codeOfConductLink).toBeVisible();
    await signUpPage.codeOfConductLink.click();
    await expect(page).toHaveURL(/\/code-of-conduct/);
  });

  test('REG-4: [Validation] Displays client validation errors for empty fields and mismatched passwords', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    // Submit empty form
    await signUpPage.submitButton.click();
    await expect(signUpPage.emailError).toBeVisible();
    await expect(signUpPage.passwordError).toBeVisible();

    // Passwords mismatch
    await signUpPage.emailInput.fill('valid.format@example.com');
    await signUpPage.passwordInput.fill('Password123!');
    await signUpPage.confirmPasswordInput.fill('DifferentPassword123!');
    await signUpPage.submitButton.click();
    await expect(signUpPage.confirmPasswordError).toContainText(/shodovat/i);

    // Short password (<8 characters)
    await signUpPage.passwordInput.fill('12345');
    await signUpPage.confirmPasswordInput.fill('12345');
    await signUpPage.submitButton.click();
    await expect(signUpPage.passwordError).toContainText(/8 znaků/i);
  });

  test('REG-5: [Edge Case] Registration with an already registered email shows clear error', async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    await signUpPage.register({
      name: 'Duplicate Jan',
      username: `dup${Date.now()}`,
      email: SEEDED_USERS.JAN_NOVAK.email, // Already exists in seed
      password: 'passwordos',
      confirmPassword: 'passwordos',
      acceptConsent: true,
    });

    // Server rejects with duplicate email error
    await expect(page).toHaveURL(/\/signup/);
    await expect(signUpPage.emailError.or(signUpPage.errorAlert)).toBeVisible({ timeout: 6_000 });
  });

  test('AUTH-1: [Happy Path] Sign in as onboarded user navigates to overview', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(SEEDED_USERS.LENKA_MALA.email, SEEDED_USERS.LENKA_MALA.password);

    await expect(page).toHaveURL(/\/overview/, { timeout: 10_000 });
  });

  test('AUTH-2: [Edge Case] Sign in with wrong password shows generic error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(SEEDED_USERS.JAN_NOVAK.email, 'wrong_password_123');

    await loginPage.expectError(/nesedí|neplatný/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-3: [Security] Sign in with non-existent email shows the same generic error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('nonexistent.user.999@example.com', 'somepassword');

    // Should not reveal whether email exists or not
    await loginPage.expectError(/nesedí|neplatný/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-4: [Security] Unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/overview');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('AUTH-5: [Happy Path] Sign out from user menu terminates session', async ({ userNoKvintet }) => {
    const loginPage = new LoginPage(userNoKvintet);

    await loginPage.signOut();

    // Now visiting overview must redirect to login
    await userNoKvintet.goto('/overview');
    await expect(userNoKvintet).toHaveURL(/\/login/);
  });
});
