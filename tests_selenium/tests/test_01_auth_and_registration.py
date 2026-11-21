import time
import pytest
from ..pages.login_page import LoginPage
from ..pages.signup_page import SignUpPage
from ..helpers.test_data import generate_random_user, SEEDED_USERS, FRONTEND_URL

class TestAuthAndRegistration:
    """Registration and Authentication integration test suite."""

    def test_reg_happy_path(self, driver):
        """[REG-1] Register a fresh user with Code of Conduct consent -> redirects to onboarding."""
        user = generate_random_user("reg-pass")
        signup_page = SignUpPage(driver)
        signup_page.open()

        # Fill and submit registration
        signup_page.register(
            email=user["email"],
            name=user["name"],
            username=user["username"],
            password=user["password"],
            confirm_password=user["password"],
            accept_consent=True,
        )

        signup_page.wait_for_url(r".*/onboarding.*")
        assert "/onboarding" in driver.current_url

    def test_reg_missing_consent_blocked(self, driver):
        """[REG-2] Form submission is blocked if Code of Conduct consent is unchecked."""
        user = generate_random_user("reg-noconsent")
        signup_page = SignUpPage(driver)
        signup_page.open()

        signup_page.register(
            email=user["email"],
            name=user["name"],
            username=user["username"],
            password=user["password"],
            confirm_password=user["password"],
            accept_consent=False,
        )

        # Must remain on signup page and show validation error
        assert "/signup" in driver.current_url
        assert signup_page.is_visible(*SignUpPage.CONSENT_ERROR)

    def test_reg_code_of_conduct_link(self, driver):
        """[REG-3] Clicking Code of Conduct link opens the guidelines page."""
        signup_page = SignUpPage(driver)
        signup_page.open()
        link = signup_page.find(*SignUpPage.CODE_OF_CONDUCT_LINK)
        assert "/code-of-conduct" in link.get_attribute("href")

        signup_page.click(*SignUpPage.CODE_OF_CONDUCT_LINK)
        # Handle target="_blank" (new window/tab)
        if len(driver.window_handles) > 1:
            driver.switch_to.window(driver.window_handles[-1])
        assert "/code-of-conduct" in driver.current_url

    def test_reg_validation_errors(self, driver):
        """[REG-4] Displays validation errors on empty submission and passwords mismatch."""
        signup_page = SignUpPage(driver)
        signup_page.open()

        # Submit empty form
        signup_page.click(*SignUpPage.SUBMIT_BUTTON)
        assert signup_page.is_visible(*SignUpPage.EMAIL_ERROR)
        assert signup_page.is_visible(*SignUpPage.PASSWORD_ERROR)

        # Mismatched passwords
        signup_page.send_keys(*SignUpPage.EMAIL_INPUT, "valid@example.com")
        signup_page.send_keys(*SignUpPage.PASSWORD_INPUT, "Password123!")
        signup_page.send_keys(*SignUpPage.CONFIRM_PASSWORD_INPUT, "Mismatch123!")
        signup_page.click(*SignUpPage.SUBMIT_BUTTON)
        assert signup_page.is_visible(*SignUpPage.CONFIRM_PASSWORD_ERROR)

    def test_reg_duplicate_email(self, driver):
        """[REG-6] Registering with an existing email displays clear server error."""
        signup_page = SignUpPage(driver)
        signup_page.open()

        signup_page.register(
            email=SEEDED_USERS["JAN_NOVAK"]["email"],
            name="Duplicate Jan",
            username=f"dup{generate_random_user()['username']}",
            password="passwordos",
            confirm_password="passwordos",
            accept_consent=True,
        )

        assert "/signup" in driver.current_url
        assert signup_page.is_visible(*SignUpPage.EMAIL_ERROR)

    def test_login_happy_path(self, driver):
        """[AUTH-1] Sign in as onboarded user routes to overview."""
        login_page = LoginPage(driver)
        login_page.open()

        login_page.login(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])

        login_page.wait_for_url(r".*/overview.*")
        assert "/overview" in driver.current_url

    def test_login_wrong_password(self, driver):
        """[AUTH-3] Sign in with wrong password displays generic error message."""
        login_page = LoginPage(driver)
        login_page.open()

        login_page.login(SEEDED_USERS["JAN_NOVAK"]["email"], "invalid_pass_xyz")

        assert "/login" in driver.current_url
        assert login_page.is_visible(*LoginPage.ERROR_ALERT)

    def test_login_nonexistent_user(self, driver):
        """[AUTH-4] Sign in with non-existent email displays same generic error message."""
        login_page = LoginPage(driver)
        login_page.open()

        login_page.login("nonexistent.random.user.999@example.com", "anypassword")

        assert "/login" in driver.current_url
        assert login_page.is_visible(*LoginPage.ERROR_ALERT)

    def test_protected_routes_redirect_to_login(self, driver):
        """[AUTH-6] Visiting protected URL while unauthenticated redirects to /login."""
        driver.get(f"{FRONTEND_URL}/overview")
        LoginPage(driver).wait_for_url(r".*/login.*")
        assert "/login" in driver.current_url

        driver.get(f"{FRONTEND_URL}/profile")
        LoginPage(driver).wait_for_url(r".*/login.*")
        assert "/login" in driver.current_url

    def test_sign_out(self, driver):
        """[AUTH-5] Signing out terminates session and protects private routes."""
        login_page = LoginPage(driver)
        login_page.open()
        login_page.login(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])
        login_page.wait_for_url(r".*/overview.*")

        login_page.sign_out()

        # Navigating back to overview should redirect to login
        driver.get(f"{FRONTEND_URL}/overview")
        login_page.wait_for_url(r".*/login.*")
        assert "/login" in driver.current_url
