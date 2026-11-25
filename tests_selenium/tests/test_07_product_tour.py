"""The mascot's product tour: first visit (#111), replay from the menus (#151, #147).

How the tour bubble sits on a phone screen is in test_12_phone_layout.
"""

import pytest
from selenium.webdriver.common.by import By

from ..conftest import inject_session
from ..helpers.api_client import create_onboarded_user
from ..helpers.i18n import t, xp
from ..pages.base_page import DIALOG
from ..pages.overview_page import OverviewPage
from ..pages.tour import Tour


class TestProductTour:
    def test_first_visit_runs_the_tour_once(self, driver, login_as, scenario):
        """#111: a newly onboarded user gets the tour once, and it is remembered."""
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
        """#151: a replayed tour starts on Home and can be closed."""
        overview = OverviewPage(driver).open()
        overview.open_user_menu()
        overview.click(By.XPATH, f"//*[@role='menuitem'][normalize-space()={xp(t('tour.replay'))}]")

        tour = Tour(driver)
        tour.wait_for_url(r"/overview")
        tour.bubble_text()
        tour.close()
        tour.wait_closed()


@pytest.mark.mobile
class TestProductTourOnPhone:
    def test_replay_tour_is_in_the_phone_menu(self, mobile_driver, scenario):
        """#147: the phone menu offers 'Replay the tour' to a signed-in user."""
        _, api = scenario.user("py-tour-phone")
        inject_session(mobile_driver, api)
        page = OverviewPage(mobile_driver).open()
        page.click(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")
        page.find_visible(By.XPATH, f"{DIALOG}//*[normalize-space()={xp(t('tour.replay'))}]")
