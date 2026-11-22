"""Onboarding wizard (#43, #91, #111, #116, #123) and the unfinished-profile gate (#117)."""

import pytest

from ..helpers.api_client import ApiClient
from ..helpers.i18n import t
from ..helpers.test_data import FRONTEND_URL, generate_random_user
from ..pages.onboarding_page import OnboardingPage
from ..pages.overview_page import OverviewPage
from ..pages.signup_page import SignUpPage


@pytest.fixture
def new_account(driver, login_as, scenario):
    """A registered user who has NOT done onboarding yet, signed in, on the first wizard page."""
    user = generate_random_user("onb")
    api = ApiClient()
    assert api.sign_up(user["email"], user["password"], user["name"], user["username"]).status_code == 200
    scenario.clients.append(api)
    login_as(api)
    page = OnboardingPage(driver).open()
    page.wait_for_page("role")
    return page, api


class TestOnboarding:
    def test_sign_up_and_complete_onboarding_end_to_end(self, driver, scenario):
        """Registration → every wizard page → Home, and the profile is stored."""
        user = generate_random_user("onb-e2e")
        signup = SignUpPage(driver).open()
        signup.register(user)

        page = OnboardingPage(driver)
        page.wait_for_url(r"/onboarding")
        page.complete(note="Automated end-to-end onboarding")
        page.wait_for_url(r"/overview")

        api = ApiClient()
        api.sign_in(user["email"], user["password"])
        scenario.clients.append(api)
        profile = api.get_profile()
        assert profile["onboardingCompletedAt"]
        assert profile["weekdays"] is True and profile["evenings"] is True
        assert profile["meetingFrequency"] == "WEEKLY"
        assert profile["latitude"] is not None and profile["radiusKm"] == 25
        assert profile["note"] == "Automated end-to-end onboarding"
        assert len(profile["roles"]) == 1

    def test_role_is_required(self, new_account):
        page, _ = new_account
        page.continue_()
        page.wait_for_text(t("onboarding.guide.role.problem"))
        assert page.current_page == "role"

    def test_days_time_place_and_frequency_are_required(self, new_account):
        page, _ = new_account
        page.pick_role()
        for step in ("teach", "learn", "interests", "summary", "days"):
            page.continue_to(step)

        page.continue_()
        page.wait_for_text(t("onboarding.guide.days.problem"))
        assert page.current_page == "days"
        page.check_option(t("onboarding.days.weekends"))
        page.continue_to("time")

        page.continue_()
        page.wait_for_text(t("onboarding.guide.time.problem"))
        assert page.current_page == "time"
        page.check_option(t("onboarding.time.mornings"))
        page.continue_to("place")

        page.continue_()
        page.wait_for_text(t("onboarding.guide.place.problem"))
        assert page.current_page == "place"
        page.pick_place_on_map()
        page.continue_to("expectations")

        page.continue_to("frequency")  # expectations are optional
        page.continue_()
        page.wait_for_text(t("onboarding.guide.frequency.problem"))
        assert page.current_page == "frequency"

    def test_tags_are_optional_and_picked_by_category(self, new_account):
        """#123: tags are picked by category, like roles, and are saved."""
        page, api = new_account
        page.pick_role()
        page.continue_to("teach")
        page.add_tag(t("categories.software-development"), t("tags.angular"))
        page.continue_to("learn")
        page.continue_to("interests")
        page.add_tag(t("categories.leisure"), t("tags.coffee"))
        page.continue_to("summary")

        summary = page.find_visible(*OverviewPage.HEADING).find_element("xpath", "./ancestor::main").text
        assert t("tags.angular") in summary
        assert t("tags.coffee") in summary

    def test_back_returns_to_previous_page_and_keeps_answers(self, new_account):
        page, _ = new_account
        page.pick_role()
        page.continue_to("teach")
        page.click(*_back())
        page.wait_for_page("role")
        # The picked role is still selected, so Continue goes straight on.
        page.continue_to("teach")

    def test_finished_onboarding_shows_home_greeting(self, new_account, driver):
        page, _ = new_account
        page.complete()
        page.wait_for_url(r"/overview")
        OverviewPage(driver).wait_for_heading(t("overview.greeting", name="User"))


class TestUnfinishedProfileGate:
    def test_feed_sends_user_without_profile_home(self, new_account, driver):
        """#117: the kvintet pages send a user with an unfinished profile to Home."""
        driver.get(f"{FRONTEND_URL}/kvintet/feed")
        overview = OverviewPage(driver)
        overview.wait_for_url(r"/overview")
        overview.wait_for_text(t("overview.profileNotFinished.title"))

    def test_home_offers_to_finish_the_profile(self, new_account, driver):
        overview = OverviewPage(driver).open()
        overview.wait_for_text(t("overview.profileNotFinished.title"))
        overview.click(*_link_text(t("overview.profileNotFinished.button")))
        overview.wait_for_url(r"/onboarding")


def _back():
    from ..pages.base_page import button

    return button(t("common.back"), scope="//main")


def _link_text(text):
    from selenium.webdriver.common.by import By

    from ..helpers.i18n import xp

    return (By.XPATH, f"//main//a[normalize-space()={xp(text)}]")
