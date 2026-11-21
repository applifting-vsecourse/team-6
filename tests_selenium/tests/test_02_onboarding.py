from selenium.webdriver.common.by import By
from ..pages.signup_page import SignUpPage
from ..pages.onboarding_page import OnboardingPage
from ..helpers.test_data import generate_random_user

class TestOnboarding:
    """Duolingo-style wizard onboarding integration tests."""

    def test_complete_onboarding_happy_path(self, driver):
        """[ONB-1] Completes all wizard steps and transitions to overview."""
        user = generate_random_user("onb-full")
        signup_page = SignUpPage(driver)
        signup_page.open()
        signup_page.register(
            email=user["email"],
            name=user["name"],
            username=user["username"],
            password=user["password"],
            confirm_password=user["password"],
            accept_consent=True,
        )

        onboarding_page = OnboardingPage(driver)
        onboarding_page.wait_for_url(r".*/onboarding.*")

        # Step 1: Role
        onboarding_page.select_role("Technologie a vývoj", "Frontend vývojář")
        onboarding_page.click_continue()

        # Step 2: Teach tags
        onboarding_page.click_continue()

        # Step 3: Learn tags
        onboarding_page.click_continue()

        # Step 4: Interests tags
        onboarding_page.click_continue()

        # Step 5: Summary of step 1 ("Na krok 2")
        onboarding_page.click_continue()

        # Step 6: Days
        onboarding_page.select_choice_tile("Všední dny")
        onboarding_page.click_continue()

        # Step 7: Time
        onboarding_page.select_choice_tile("Odpoledne")
        onboarding_page.click_continue()

        # Step 8: Location map
        onboarding_page.select_map_location()
        onboarding_page.click_continue()

        # Step 9: Expectations
        onboarding_page.click_continue()

        # Step 10: Frequency
        onboarding_page.select_frequency("týdně")
        onboarding_page.click_continue()

        # Step 11: Note (final step -> "Hotovo")
        onboarding_page.fill_note("Selenium automation test note!")
        onboarding_page.click_finish()

        onboarding_page.wait_for_url(r".*/overview.*")
        assert "/overview" in driver.current_url
