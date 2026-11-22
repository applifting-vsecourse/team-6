"""Profile page (#97, #119, #152) and deleting the account (#65)."""

from selenium.webdriver.common.by import By

from ..helpers.api_client import ApiClient
from ..helpers.i18n import t, xp
from ..helpers.test_data import FRONTEND_URL
from ..pages.onboarding_page import OnboardingPage
from ..pages.profile_page import ProfilePage


class TestProfile:
    def test_profile_shows_identity_and_answers(self, driver, fresh_user):
        user, _ = fresh_user
        profile = ProfilePage(driver).open().wait_loaded()

        assert profile.name_heading() == user["name"]
        main = driver.find_element(By.TAG_NAME, "main").text
        assert f"@{user['username']}" in main
        assert t("roles.software-engineer") in main

    def test_when_and_where_shows_city_and_search_radius(self, driver, fresh_user):
        """#119: the search radius is part of 'When and where'."""
        profile = ProfilePage(driver).open().wait_loaded()
        section = profile.section_text(t("profile.sections.whenAndWhere"))
        assert "Praha" in section
        assert t("profile.withinRadius", count=25) in section

    def test_edit_saves_one_page_and_returns_to_profile(self, driver, fresh_user):
        """#152: Edit opens that section's page; Save stores it and returns to the profile."""
        _, api = fresh_user
        profile = ProfilePage(driver).open().wait_loaded()
        profile.edit_section(t("profile.sections.whenAndWhere"))

        onboarding = OnboardingPage(driver)
        onboarding.wait_for_page("days")
        assert "from=profile" in driver.current_url
        onboarding.check_option(t("onboarding.days.weekends"))
        onboarding.click(*_main_button(t("onboarding.saveAndReturn")))

        profile.wait_for_url(r"/profile$")
        assert api.get_profile()["weekends"] is True

    def test_back_to_profile_discards_changes(self, driver, fresh_user):
        """#152: 'Back to profile' returns without saving."""
        _, api = fresh_user
        profile = ProfilePage(driver).open().wait_loaded()
        profile.edit_section(t("profile.sections.whenAndWhere"))

        onboarding = OnboardingPage(driver)
        onboarding.wait_for_page("days")
        onboarding.check_option(t("onboarding.days.weekends"))
        onboarding.click(By.XPATH, f"//*[self::a or self::button][normalize-space()={xp(t('onboarding.backToProfile'))}]")

        profile.wait_for_url(r"/profile$")
        assert api.get_profile()["weekends"] is False

    def test_each_edit_link_opens_its_own_page(self, driver, fresh_user):
        """#152: teach / learn / interests no longer all open the role page."""
        expected = {
            "profile.sections.role": "role",
            "profile.sections.teach": "teach",
            "profile.sections.learn": "learn",
            "profile.sections.interests": "interests",
            "profile.sections.whenAndWhere": "days",
            "profile.sections.expectations": "expectations",
        }
        for key, page in expected.items():
            ProfilePage(driver).open().wait_loaded().edit_section(t(key))
            OnboardingPage(driver).wait_for_page(page)


class TestDeleteAccount:
    def test_cancel_keeps_the_account(self, driver, fresh_user):
        _, api = fresh_user
        profile = ProfilePage(driver).open().wait_loaded()
        profile.open_delete_dialog()
        profile.cancel_delete()

        assert "/profile" in driver.current_url
        assert api.get_profile()["onboardingCompletedAt"]

    def test_delete_removes_account_and_signs_out(self, driver, fresh_user):
        user, _ = fresh_user
        profile = ProfilePage(driver).open().wait_loaded()
        profile.open_delete_dialog()
        profile.confirm_delete()

        profile.wait_for_url(r"^http://localhost:3050/?($|\?|login|signup)")
        driver.get(f"{FRONTEND_URL}/overview")
        profile.wait_for_url(r"/login")

        resp = ApiClient().session.post(
            f"{ApiClient().backend_url}/api/auth/sign-in/email",
            json={"email": user["email"], "password": user["password"]},
        )
        assert resp.status_code == 401

    def test_deleting_a_member_frees_their_seat(self, driver, login_as, scenario):
        """Deleting the account also leaves the kvintet (#65)."""
        _, _, people = scenario.forming_kvintet(2)
        login_as(people[1][1])

        profile = ProfilePage(driver).open().wait_loaded()
        profile.open_delete_dialog()
        profile.confirm_delete()
        profile.wait_for_url(r"^http://localhost:3050/?($|\?|login|signup)")

        members = people[0][1].get_my_kvintet().json()["members"]
        assert len(members) == 1


def _main_button(text):
    return (By.XPATH, f"//main//button[normalize-space()={xp(text)}]")
