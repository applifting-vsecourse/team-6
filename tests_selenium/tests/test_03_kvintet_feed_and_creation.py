from selenium.webdriver.common.by import By
from ..pages.feed_page import FeedPage
from ..helpers.test_data import generate_random_proposal, generate_random_user
from ..helpers.api_client import ApiClient

class TestKvintetFeedAndCreation:
    """Proposal feed browsing, filtering, and creation tests."""

    def test_feed_displays_proposals(self, user_no_kvintet):
        """[PRO-1] Open feed displays active forming proposal cards with seat counts."""
        feed_page = FeedPage(user_no_kvintet)
        feed_page.open()

        cards = feed_page.find_all(*FeedPage.CARDS)
        assert len(cards) > 0, "Feed should contain proposal cards"

        first_card_text = cards[0].text
        assert "/ 5" in first_card_text or "5" in first_card_text

    def test_feed_category_filter(self, user_no_kvintet):
        """[CAT-2] Clicking category tab applies category filter in URL."""
        feed_page = FeedPage(user_no_kvintet)
        feed_page.open()

        cat_tab = user_no_kvintet.find_element(By.XPATH, "//button[contains(., 'Data a AI') or contains(., 'Jazyky') or contains(., 'Podnikání')]")
        cat_tab.click()

        feed_page.wait_for_url(r".*category=.*")
        assert "category=" in user_no_kvintet.current_url

    def test_create_kvintet_validation(self, user_no_kvintet):
        """[PROP-1 / PR #154] Modal validates mandatory description length (10-280 chars) and title."""
        feed_page = FeedPage(user_no_kvintet)
        feed_page.open()

        feed_page.open_start_dialog()

        # Submit empty modal
        feed_page.click(*FeedPage.DIALOG_SUBMIT_BTN)
        assert feed_page.is_visible(*FeedPage.TITLE_ERROR)

        # Fill title and category, but description too short (<10 chars)
        feed_page.send_keys(*FeedPage.DIALOG_TITLE_INPUT, "Selenium Test Proposal")
        feed_page.select_dialog_category("Data a AI")
        feed_page.send_keys(*FeedPage.DIALOG_DESC_INPUT, "Short")
        feed_page.click(*FeedPage.DIALOG_SUBMIT_BTN)

        assert feed_page.is_visible(*FeedPage.DESC_ERROR)
        error_msg = feed_page.get_text(*FeedPage.DESC_ERROR)
        assert "10" in error_msg

        # Cancel dialog
        feed_page.click(*FeedPage.DIALOG_CANCEL_BTN)

    def test_create_kvintet_happy_path(self, driver, login_as):
        """[PRO-6] User without kvintet creates a new proposal and lands on overview."""
        # Create fresh user via API so they have no kvintet
        user = generate_random_user("prop-creator")
        api = ApiClient()
        api.sign_up(user["email"], user["password"], user["name"], user["username"])
        api.complete_onboarding()

        login_as(user)

        feed_page = FeedPage(driver)
        feed_page.open()
        feed_page.open_start_dialog()

        proposal = generate_random_proposal("Automation Craft")
        feed_page.fill_and_submit_proposal(
            title=proposal["title"],
            description=proposal["description"],
            category="Data a AI",
        )

        feed_page.wait_for_url(r".*/overview.*")
        assert proposal["title"] in driver.page_source
