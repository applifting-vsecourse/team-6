"""Home (/overview): its heading in every state (#161) and the members on a phone (#148).

What Home shows for a forming or an active kvintet is covered with those features
(test_05_proposal_voting_and_leaving, test_06_active_kvintet_and_chat).
"""

import time

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from ..conftest import inject_session
from ..helpers.api_client import ApiClient
from ..helpers.i18n import t
from ..helpers.test_data import generate_random_user
from ..pages.base_page import BasePage
from ..pages.overview_page import OverviewPage

# The line #161 removed: "Neděle 23. listopadu" / "Sunday, November 23", in the page's language.
_HEADER_DATE_JS = """
const lang = document.documentElement.lang || "cs";
return new Intl.DateTimeFormat(lang, {weekday: "long", day: "numeric", month: "long"}).format(new Date());
"""


def _home_state(scenario, state):
    """A signed-in ApiClient whose Home shows `state`."""
    if state == "not-onboarded":
        user = generate_random_user("py-home")
        api = ApiClient()
        assert api.sign_up(user["email"], user["password"], user["name"], user["username"]).status_code == 200
        scenario.clients.append(api)
        return api
    if state == "no-kvintet":
        return scenario.user("py-home")[1]
    if state == "forming":
        return scenario.forming_kvintet(2, "py-home")[2][0][1]
    _, _, people = scenario.active_kvintet("py-home")
    api = people[0][1]
    api.session.post(api._url("/kvintets/mine/begins-seen"))
    return api


# Read in one go inside the page: Home re-renders as its data arrives, so an element held from
# an earlier call can go stale.
_ABOVE_HEADING_JS = """
const h1 = document.querySelector("main h1");
const above = [];
for (let e = h1.previousElementSibling; e; e = e.previousElementSibling) {
  if (e.innerText.trim()) above.push(e.innerText.trim());
}
return {main: document.querySelector("main").innerText, above};
"""


def _assert_no_date_above_heading(drv):
    BasePage(drv, timeout=15).find_visible(By.CSS_SELECTOR, "main h1")
    time.sleep(0.5)
    date = drv.execute_script(_HEADER_DATE_JS)
    page = drv.execute_script(_ABOVE_HEADING_JS)
    assert date.lower() not in page["main"].lower(), f"Home still shows the date '{date}'"
    assert not page["above"], f"something is above the Home heading: {page['above']}"


class TestHomeHeading:
    """#161: the heading is the first thing on Home; the date above it is gone."""

    @pytest.mark.parametrize("state", ["not-onboarded", "no-kvintet", "forming", "active"])
    def test_no_date_above_the_heading(self, driver, login_as, scenario, state):
        login_as(_home_state(scenario, state))
        BasePage(driver).open("/overview")
        _assert_no_date_above_heading(driver)

    def test_no_date_in_english_either(self, fresh_user, driver):
        page = BasePage(driver).open("/overview")
        page.find_visible(By.CSS_SELECTOR, "main h1")
        page.switch_language("English")
        WebDriverWait(driver, 5).until(lambda d: page.html_lang().startswith("en"))
        _assert_no_date_above_heading(driver)


@pytest.mark.mobile
class TestHomeOnPhone:
    @pytest.mark.parametrize("state", ["no-kvintet", "active"])
    def test_no_date_above_the_heading(self, phone, phone_login, scenario, state):
        phone_login(_home_state(scenario, state))
        BasePage(phone).open("/overview")
        _assert_no_date_above_heading(phone)

    def test_members_are_listed_on_a_phone(self, mobile_driver, scenario):
        """#148: on a phone, Home still shows who is in the kvintet."""
        _, _, people = scenario.active_kvintet("py-home-members")
        api = people[0][1]
        api.session.post(api._url("/kvintets/mine/begins-seen"))
        inject_session(mobile_driver, api)

        overview = OverviewPage(mobile_driver).open()
        overview.wait_for_heading(t("overview.active.heading"))
        overview.wait_for_text(people[1][0]["name"])
