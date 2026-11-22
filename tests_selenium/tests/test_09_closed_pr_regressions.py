"""Regression tests pinned to merged pull requests. Each test names the PR it guards."""

import pytest
from selenium.webdriver.common.by import By

from ..conftest import inject_session
from ..helpers.i18n import t, xp
from ..pages.base_page import DIALOG
from ..pages.feed_page import FeedPage
from ..pages.onboarding_page import OnboardingPage
from ..pages.overview_page import OverviewPage
from ..pages.tour import Tour


class TestKvintetDescriptionPR154:
    """#154 / #137: the description is mandatory and 10–280 characters long."""

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
        _, api = scenario.user("py-pr154")
        resp = api.session.post(
            api._url("/kvintets"),
            json={"title": "Too short", "description": "short", "categorySlugs": ["leisure"]},
        )
        assert resp.status_code == 400


class TestUpToThreeCategoriesPR118:
    """#118 / #67: a kvintet has 1–3 categories."""

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
        _, api = scenario.user("py-pr118")
        resp = api.session.post(
            api._url("/kvintets"),
            json={
                "title": "Four categories",
                "description": "Should be rejected by the API.",
                "categorySlugs": ["data-ai", "business", "languages", "leisure"],
            },
        )
        assert resp.status_code == 400


class TestLeaveLastMemberPR124:
    """#124: the leave dialog tells the last member the kvintet is removed."""

    def test_last_member_is_warned_and_kvintet_disappears(self, driver, login_as, scenario, user_no_kvintet_api):
        _, proposal, people = scenario.forming_kvintet(1)
        login_as(people[0][1])
        overview = OverviewPage(driver).open()

        dialog = overview.open_leave_dialog()
        assert t("kvintet.dialog.leaveLastMemberDescription") in dialog.text
        overview.confirm_leave()

        feed_titles = [k["title"] for k in _feed(user_no_kvintet_api)]
        assert proposal["title"] not in feed_titles


class TestProductTourPR111And151:
    """#111: a newly onboarded user gets a mascot tour once. #151: a replayed tour works and ends."""

    def test_first_visit_runs_the_tour_once(self, driver, login_as, scenario):
        from ..helpers.api_client import create_onboarded_user

        _, api = create_onboarded_user("py-tour", tour_done=False)
        scenario.clients.append(api)
        login_as(api)
        OverviewPage(driver).open()

        tour = Tour(driver)
        assert t("tour.overviewNoCount")[:20] in tour.bubble_text() or "Toto je domovská" in tour.bubble_text()
        tour.next()
        tour.wait_for_url(r"/kvintet/feed")
        tour.wait_for_text(t("tour.feed"))
        tour.next()
        tour.wait_for_text(t("tour.header"))
        tour.done()

        tour.wait_closed()
        assert api.get_profile()["tourCompletedAt"]

        OverviewPage(driver).open()
        assert not tour.is_showing(timeout=3)

    def test_tour_can_be_replayed_from_the_user_menu(self, driver, fresh_user):
        overview = OverviewPage(driver).open()
        overview.open_user_menu()
        overview.click(By.XPATH, f"//*[@role='menuitem'][normalize-space()={xp(t('tour.replay'))}]")

        tour = Tour(driver)
        tour.wait_for_url(r"/overview")
        tour.bubble_text()
        tour.close()
        tour.wait_closed()

    def test_replay_tour_is_in_the_phone_menu(self, mobile_driver, scenario):
        """#147: the phone menu offers 'Replay the tour' to a signed-in user."""
        _, api = scenario.user("py-pr147")
        inject_session(mobile_driver, api)
        page = OverviewPage(mobile_driver).open()
        page.click(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")
        page.find_visible(By.XPATH, f"{DIALOG}//*[normalize-space()={xp(t('tour.replay'))}]")


class TestPhoneOverviewPR148:
    """#148: on a phone, Home still shows who is in the kvintet."""

    def test_members_are_listed_on_a_phone(self, mobile_driver, scenario):
        _, _, people = scenario.active_kvintet("py-pr148")
        api = people[0][1]
        api.session.post(api._url("/kvintets/mine/begins-seen"))
        inject_session(mobile_driver, api)

        overview = OverviewPage(mobile_driver).open()
        overview.wait_for_heading(t("overview.active.heading"))
        overview.wait_for_text(people[1][0]["name"])


class TestMapPinPR116:
    """#116: the map shows a pin only after the user picks a place."""

    def test_no_pin_until_a_place_is_picked(self, driver, login_as, scenario):
        from ..helpers.api_client import ApiClient
        from ..helpers.test_data import generate_random_user

        user = generate_random_user("py-pr116")
        api = ApiClient()
        api.sign_up(user["email"], user["password"], user["name"], user["username"])
        scenario.clients.append(api)
        api.session.put(
            api._url("/me/profile"),
            json={"roles": ["software-engineer"], "weekdays": True, "evenings": True},
        ).raise_for_status()
        login_as(api)

        page = OnboardingPage(driver).open("/onboarding?page=place")
        page.wait_for_page("place")
        page.find_visible(*OnboardingPage.MAP)
        assert not page.find_all_visible(By.CSS_SELECTOR, ".leaflet-marker-icon, .leaflet-interactive")

        page.pick_place_on_map()
        page.find_visible(By.CSS_SELECTOR, ".leaflet-marker-icon, .leaflet-interactive")


@pytest.fixture
def user_no_kvintet_api():
    from ..helpers.api_client import ApiClient
    from ..helpers.test_data import SEEDED_USERS

    api = ApiClient()
    api.sign_in(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])
    return api


def _feed(api):
    body = api.session.get(api._url("/kvintets/feed")).json()
    return body["items"] if isinstance(body, dict) else body
