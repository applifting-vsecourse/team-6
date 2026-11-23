"""Kvintet feed: browse, filter, join (#40, #51, #69, #95) and start a kvintet (#67, #118, #137, #154)."""

import pytest
from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from ..helpers.test_data import generate_random_proposal
from ..pages.base_page import DIALOG
from ..pages.feed_page import FeedPage
from ..pages.overview_page import OverviewPage


class TestFeed:
    def test_feed_lists_forming_kvintets_with_free_seats(self, user_no_kvintet):
        feed = FeedPage(user_no_kvintet).open().wait_loaded()
        cards = feed.find_all_visible(*FeedPage.CARDS)
        assert cards, "the seeded feed has forming kvintets"
        for card in cards:
            assert "/ 5" in card.text, f"seat count missing on card: {card.text!r}"
            assert t("kvintet.join") in card.text

    def test_active_kvintets_are_not_in_the_feed(self, user_no_kvintet):
        feed = FeedPage(user_no_kvintet).open().wait_loaded()
        assert "Frontend craft circle" not in feed.card_titles()

    def test_category_filter_narrows_the_feed(self, user_no_kvintet, scenario):
        """#51: filtering by category keeps the matching kvintets and is kept in the URL."""
        _, data_ai, _ = scenario.forming_kvintet(1, prefix="py-filter-data")
        feed = FeedPage(user_no_kvintet).open().wait_loaded()
        assert data_ai["title"] in feed.card_titles()

        feed.toggle_category_filter("languages")
        feed.wait_for_url(r"category=.*languages")
        feed.wait_until_gone(*_title(data_ai["title"]))
        assert "Spanish conversation over lunch" in feed.card_titles()

        feed.toggle_category_filter("languages")  # off again
        feed.toggle_category_filter("data-ai")
        feed.wait_for_url(r"category=.*data-ai")
        feed.find_visible(*_title(data_ai["title"]))
        assert "Spanish conversation over lunch" not in feed.card_titles()

    def test_filter_without_results_shows_empty_state(self, user_no_kvintet):
        feed = FeedPage(user_no_kvintet).open().wait_loaded()
        feed.toggle_category_filter("cloud-security")
        feed.wait_for_text(t("kvintet.emptyFiltered.title", filter=t("categories.cloud-security")))

    def test_joining_from_the_feed_makes_you_a_member(self, driver, fresh_user, scenario):
        """#40: Join puts you in the kvintet and shows it on Home."""
        kvintet_id, proposal, people = scenario.forming_kvintet(1, prefix="py-join")
        _, api = fresh_user

        feed = FeedPage(driver).open().wait_loaded()
        feed.join(proposal["title"])

        overview = OverviewPage(driver)
        overview.wait_for_url(r"/overview")
        overview.wait_for_heading(t("overview.forming.heading"))
        assert proposal["title"] in overview.main_text()
        assert len(api.get_my_kvintet().json()["members"]) == 2


class TestStartKvintet:
    def test_empty_dialog_shows_required_messages(self, user_no_kvintet):
        dialog = FeedPage(user_no_kvintet).open().wait_loaded().open_start_dialog()
        dialog.submit()

        assert dialog.error("title") == t("kvintet.validation.titleRequired")
        assert dialog.error("description") == t("kvintet.validation.descriptionRequired")
        assert dialog.has_text(t("kvintet.validation.categoryRequired"))
        dialog.cancel()

    def test_cancel_closes_without_creating(self, user_no_kvintet):
        feed = FeedPage(user_no_kvintet).open().wait_loaded()
        before = feed.card_titles()
        dialog = feed.open_start_dialog()
        dialog.fill_title("Should not be created")
        dialog.cancel()
        assert feed.card_titles() == before

    def test_start_kvintet_happy_path(self, driver, fresh_user):
        proposal = generate_random_proposal("py-start")
        dialog = FeedPage(driver).open().wait_loaded().open_start_dialog()
        dialog.fill_title(proposal["title"])
        dialog.toggle_category(proposal["category_label"])
        dialog.fill_description(proposal["description"])
        dialog.submit()

        overview = OverviewPage(driver)
        overview.wait_for_url(r"/overview")
        overview.wait_for_heading(t("overview.forming.heading"))
        assert proposal["title"] in overview.main_text()
        assert proposal["description"] in overview.main_text()

        kvintet = fresh_user[1].get_my_kvintet().json()
        assert kvintet["status"] == "FORMING"
        assert kvintet["title"] == proposal["title"]


def _title(title):
    from selenium.webdriver.common.by import By

    from ..helpers.i18n import xp

    return (By.XPATH, f"//main//li//h2[normalize-space()={xp(title)}]")


class TestKvintetDescription:
    """#154 / #137: the description is mandatory and 10-280 characters long."""

    @pytest.fixture
    def dialog(self, driver, fresh_user):
        dialog = FeedPage(driver).open().wait_loaded().open_start_dialog()
        dialog.fill_title("Boundary check")
        dialog.toggle_category(t("categories.data-ai"))
        return dialog

    def test_nine_characters_is_too_short(self, dialog):
        dialog.fill_description("123456789")
        dialog.submit()
        assert dialog.error("description") == t("kvintet.validation.descriptionTooShort", min=10)

    def test_ten_characters_is_enough(self, dialog, fresh_user):
        dialog.fill_description("1234567890")
        dialog.submit()
        dialog.wait_for_url(r"/overview")
        assert fresh_user[1].get_my_kvintet().json()["description"] == "1234567890"

    def test_whitespace_does_not_count(self, dialog):
        dialog.fill_description("          ")
        dialog.submit()
        assert dialog.error("description") in (
            t("kvintet.validation.descriptionRequired"),
            t("kvintet.validation.descriptionTooShort", min=10),
        )

    def test_typing_stops_at_280_characters(self, dialog):
        dialog.fill_description("x" * 300)
        value = dialog.field("description").get_attribute("value")
        assert len(value) == 280

    def test_backend_rejects_short_description(self, scenario):
        _, api = scenario.user("py-description")
        resp = api.session.post(
            api._url("/kvintets"),
            json={"title": "Too short", "description": "short", "categorySlugs": ["leisure"]},
        )
        assert resp.status_code == 400


class TestKvintetCategories:
    """#118 / #67: a kvintet has 1-3 categories."""

    def test_fourth_category_cannot_be_picked(self, user_no_kvintet):
        dialog = FeedPage(user_no_kvintet).open().wait_loaded().open_start_dialog()
        labels = [t(f"categories.{s}") for s in ("software-development", "data-ai", "business", "languages")]
        for label in labels[:3]:
            dialog.toggle_category(label)
        assert sorted(dialog.selected_categories()) == sorted(labels[:3])

        fourth = dialog.find(By.XPATH, f"{DIALOG}//button[normalize-space()={xp(labels[3])}]")
        assert not fourth.is_enabled() or fourth.get_attribute("aria-disabled") == "true"
        dialog.cancel()

    def test_backend_rejects_four_categories(self, scenario):
        _, api = scenario.user("py-categories")
        resp = api.session.post(
            api._url("/kvintets"),
            json={
                "title": "Four categories",
                "description": "Should be rejected by the API.",
                "categorySlugs": ["data-ai", "business", "languages", "leisure"],
            },
        )
        assert resp.status_code == 400
