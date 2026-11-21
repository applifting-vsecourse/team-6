from selenium.webdriver.common.by import By
from ..pages.feed_page import FeedPage
from ..pages.profile_page import ProfilePage
from ..pages.overview_page import OverviewPage
from ..helpers.test_data import generate_random_user
from ..helpers.api_client import ApiClient

class TestClosedPrRegressions:
    """Specific regression test cases for closed PRs and GitHub issues."""

    def test_regress_pr154_description_min_length(self, user_no_kvintet):
        """[PR #154 / Issue #131] Enforce description length to be at least 10 characters."""
        feed_page = FeedPage(user_no_kvintet)
        feed_page.open()

        feed_page.open_start_dialog()
        feed_page.send_keys(*FeedPage.DIALOG_TITLE_INPUT, "Boundary 10 Chars Test")
        feed_page.select_dialog_category("Data a AI")

        # 9 chars -> error
        feed_page.send_keys(*FeedPage.DIALOG_DESC_INPUT, "123456789")
        feed_page.click(*FeedPage.DIALOG_SUBMIT_BTN)

        assert feed_page.is_visible(*FeedPage.DESC_ERROR)
        assert "10" in feed_page.get_text(*FeedPage.DESC_ERROR)

        # 10 chars -> passes min 10 validation
        feed_page.send_keys(*FeedPage.DIALOG_DESC_INPUT, "1234567890")
        feed_page.click(*FeedPage.DIALOG_SUBMIT_BTN)
        if feed_page.is_visible(*FeedPage.DESC_ERROR, timeout=1):
            assert "10" not in feed_page.get_text(*FeedPage.DESC_ERROR)

        feed_page.click(*FeedPage.DIALOG_CANCEL_BTN)

    def test_regress_pr118_multi_categories(self, user_no_kvintet):
        """[PR #118 / Issue #66] Choose up to 3 categories when creating a kvintet."""
        feed_page = FeedPage(user_no_kvintet)
        feed_page.open()

        feed_page.open_start_dialog()

        # Select 3 categories
        cat_buttons = user_no_kvintet.find_elements(By.XPATH, "//*[@role='dialog']//*[@role='group']//button | //*[@role='dialog']//button[@data-state]")
        assert len(cat_buttons) >= 3

        cat_buttons[0].click()
        cat_buttons[1].click()
        cat_buttons[2].click()

        # Check 3 are pressed
        selected = user_no_kvintet.find_elements(By.XPATH, "//*[@role='dialog']//button[@aria-pressed='true' or @data-state='on']")
        assert len(selected) == 3

        feed_page.click(*FeedPage.DIALOG_CANCEL_BTN)

    def test_regress_pr119_profile_search_radius(self, user_no_kvintet):
        """[PR #119 / Issue #81] Profile displays the search radius."""
        profile_page = ProfilePage(user_no_kvintet)
        profile_page.open()

        # Should display radius or distance (e.g. km)
        assert "km" in user_no_kvintet.page_source or "Okolí" in user_no_kvintet.page_source

    def test_regress_pr124_leave_last_member_warning(self, driver, login_as):
        """[PR #124 / Issue #121] Leave dialog warns sole creator that kvintet will be deleted."""
        user = generate_random_user("sole-creator")
        api = ApiClient()
        api.sign_up(user["email"], user["password"], user["name"], user["username"])
        api.complete_onboarding()
        api.create_kvintet("Solo Test Kvintet", "Checking warning text when last member leaves.")

        login_as(user)

        overview_page = OverviewPage(driver)
        overview_page.open()

        overview_page.open_leave_dialog()
        dialog_text = overview_page.get_text(*OverviewPage.LEAVE_DIALOG)
        assert any(w in dialog_text.lower() for w in ["smazán", "odstraněn", "poslední", "zrušen"])

        overview_page.cancel_leave()
