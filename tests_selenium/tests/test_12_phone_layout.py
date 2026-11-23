"""Phone layout: every control is on screen, not covered, and reachable above the keyboard.

Every test runs on each phone in conftest.PHONES (a small 320x568 one and a common 390x844 one),
with touch emulation and the fake on-screen keyboard from helpers/mobile.py. "Tappable" means:
after scrolling it into view the way a user would, the control is fully inside the visible area
(above the keyboard when it is open) and nothing else, such as the sticky header, the mascot,
or a sheet, sits on top of it.

Covers the phone work in #88 (app shell and menu), #106/#113 (bottom sheets, swipe to dismiss),
#115 (dialogs with the keyboard open), #125/#145/#147/#148 (phone fixes).
"""

import time

import pytest
from selenium.webdriver.common.by import By

from ..helpers import mobile
from ..helpers.api_client import ApiClient
from ..helpers.i18n import t, xp
from ..helpers.test_data import FRONTEND_URL, generate_random_proposal, generate_random_user
from ..pages.base_page import DIALOG, BasePage, button
from ..pages.chat_page import ChatPage
from ..pages.feed_page import FeedPage
from ..pages.onboarding_page import OnboardingPage
from ..pages.overview_page import OverviewPage
from ..pages.profile_page import ProfilePage
from ..pages.tour import Tour

pytestmark = pytest.mark.mobile

MENU_BUTTON = (By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")


def _sweep(driver, scope=None, skip=()):
    mobile.assert_no_horizontal_scroll(driver)
    mobile.assert_all_controls_tappable(driver, scope, skip)


def _visible_dialog(driver):
    return BasePage(driver).find_visible(By.XPATH, DIALOG)


def _typing_in(driver, element):
    """Focuses a text field (opening the keyboard) and checks the field itself is not hidden."""
    mobile.focus(driver, element)
    assert mobile.keyboard_height(driver) > 0, "focusing a text field should open the keyboard"
    mobile.assert_tappable(driver, element, "the focused field", reveal=False)


@pytest.fixture
def signed_in_phone(phone, phone_login, scenario):
    """A phone signed in as a fresh onboarded user with no kvintet. Returns (phone, user, api)."""
    user, api = scenario.user("py-phone")
    phone_login(api)
    return phone, user, api


# --- public pages -----------------------------------------------------------------------


class TestPublicScreens:
    @pytest.mark.parametrize("path", ["/", "/login", "/signup", "/how-it-works", "/code-of-conduct"])
    def test_page_fits_and_every_control_is_tappable(self, phone, path):
        page = BasePage(phone).open(path)
        page.find_visible(By.CSS_SELECTOR, "main h1")
        time.sleep(1)  # let entrance animations finish
        # The landing video starts muted as soon as it scrolls into view and drops its play
        # overlay, so the play button is never there to be tapped once it is on screen.
        _sweep(phone, skip=(t("videoPlayer.play"),))

    def test_sign_in_while_the_keyboard_is_open(self, phone, scenario):
        user, _ = scenario.user("py-phone-login")
        page = BasePage(phone).open("/login")
        submit = page.find_visible(By.CSS_SELECTOR, "main button[type='submit']")

        for name, value in (("email", user["email"]), ("password", user["password"])):
            field = page.find_visible(By.NAME, name)
            _typing_in(phone, field)
            field.send_keys(value)
            mobile.assert_tappable(phone, submit, "Sign in, with the keyboard open")

        submit.click()
        page.wait_for_url(r"/overview")

    def test_sign_up_form_with_the_keyboard_open(self, phone):
        page = BasePage(phone).open("/signup")
        submit = page.find_visible(By.CSS_SELECTOR, "main button[type='submit']")
        consent = page.find(By.CSS_SELECTOR, "main button[role='checkbox']")

        for name in ("name", "username", "email", "password", "passwordConfirmation"):
            _typing_in(phone, page.field(name))
            mobile.assert_tappable(phone, consent, "community-rules checkbox, with the keyboard open")
            mobile.assert_tappable(phone, submit, "Create account, with the keyboard open")

    def test_validation_messages_do_not_push_the_submit_button_away(self, phone):
        page = BasePage(phone).open("/signup")
        page.click(By.CSS_SELECTOR, "main button[type='submit']")
        page.wait_for_text(t("auth.validation.nameRequired"))
        _sweep(phone)

    def test_phone_menu_opens_and_its_links_navigate(self, phone):
        page = BasePage(phone).open("/")
        page.click(*MENU_BUTTON)
        sheet = _visible_dialog(phone)
        _sweep(phone, scope=sheet)

        page.click(By.XPATH, f"{DIALOG}//a[@href='/login']")
        page.wait_for_url(r"/login")
        page.wait_until_gone(By.XPATH, DIALOG)


# --- signed in ------------------------------------------------------------------------------


class TestSignedInScreens:
    @pytest.mark.parametrize("path", ["/overview", "/kvintet/feed", "/profile"])
    def test_page_fits_and_every_control_is_tappable(self, signed_in_phone, path):
        phone, _, _ = signed_in_phone
        page = BasePage(phone).open(path)
        page.find_visible(By.CSS_SELECTOR, "main h1")
        time.sleep(1)
        _sweep(phone)

    def test_signed_in_menu_has_every_destination_and_works(self, signed_in_phone):
        """#88 / #125 / #147: profile, Home, Kvintets, tour replay and sign-out are all in the phone menu."""
        phone, user, _ = signed_in_phone
        page = OverviewPage(phone).open()
        page.click(*MENU_BUTTON)
        sheet = _visible_dialog(phone)
        _sweep(phone, scope=sheet)

        text = sheet.text
        for expected in (user["name"], t("nav.overview"), t("nav.kvintetFeed"), t("tour.replay"), t("auth.signOut")):
            assert expected in text, f"'{expected}' missing from the phone menu"

        page.click(By.XPATH, f"{DIALOG}//a[@href='/kvintet/feed']")
        page.wait_for_url(r"/kvintet/feed")
        page.wait_until_gone(By.XPATH, DIALOG)

        page.click(*MENU_BUTTON)
        page.click(*button(t("auth.signOut"), scope=DIALOG))
        phone.get(f"{FRONTEND_URL}/overview")
        page.wait_for_url(r"/login")

    def test_join_from_the_feed_through_the_details_sheet(self, phone, phone_login, scenario):
        """On a phone the feed shows compact cards: View opens a details sheet with Join."""
        _, proposal, _ = scenario.forming_kvintet(1, prefix="py-phone-feed")
        _, api = scenario.user("py-phone-joiner")
        phone_login(api)
        feed = FeedPage(phone).open().wait_loaded()

        chip = feed.find(By.XPATH, f"//main//button[@data-slot='toggle-group-item'][normalize-space()={xp(proposal['category_label'])}]")
        mobile.assert_tappable(phone, chip, "category chip")
        chip.click()
        feed.wait_for_url(r"category=")

        view = feed.card(proposal["title"]).find_element(*button(t("kvintet.view"), scope="."))
        mobile.assert_tappable(phone, view, "View")
        view.click()

        sheet = _visible_dialog(phone)
        feed.find_visible(By.XPATH, f"{DIALOG}//h2[normalize-space()={xp(proposal['title'])}]")  # sheet finished opening
        _sweep(phone, scope=sheet)
        join = sheet.find_element(*button(t("kvintet.join"), scope="."))
        join.click()
        OverviewPage(phone).wait_for_heading(t("overview.forming.heading"))
        assert api.get_my_kvintet().json()["title"] == proposal["title"]


# --- onboarding -------------------------------------------------------------------------------


class TestOnboardingOnPhone:
    @pytest.fixture
    def wizard(self, phone, phone_login, scenario):
        user = generate_random_user("py-phone-onb")
        api = ApiClient()
        assert api.sign_up(user["email"], user["password"], user["name"], user["username"]).status_code == 200
        scenario.clients.append(api)
        phone_login(api)
        page = OnboardingPage(phone).open()
        page.wait_for_page("role")
        return page

    def test_every_wizard_page_fits_and_nothing_covers_its_buttons(self, phone, wizard):
        """The guide mascot sits over every wizard page; it must not cover Continue or Back."""
        page = wizard

        def check():
            time.sleep(0.8)
            # Leaflet's own zoom buttons and attribution are part of the map widget.
            _sweep(phone, skip=("Zoom in", "Zoom out", "Leaflet", "OpenStreetMap"))

        check()
        page.pick_role()
        check()
        for step in ("teach", "learn", "interests", "summary", "days"):
            page.continue_to(step)
            check()
        page.check_option(t("onboarding.days.weekdays"))
        page.continue_to("time")
        check()
        page.check_option(t("onboarding.time.evenings"))
        page.continue_to("place")
        check()
        page.pick_place_on_map()
        page.continue_to("expectations")
        check()
        page.continue_to("frequency")
        check()
        page.check_option(t("onboarding.frequency.weekly"))
        page.continue_to("note")
        check()

        note = page.find_visible(*OnboardingPage.NOTE)
        _typing_in(phone, note)
        note.send_keys("Psáno na telefonu")
        mobile.assert_tappable(phone, page.find(*OnboardingPage.SUBMIT), "Done, with the keyboard open")
        page.find(*OnboardingPage.SUBMIT).click()
        page.wait_for_url(r"/overview")

    def test_search_fields_keep_continue_reachable(self, phone, wizard):
        page = wizard
        search = page.find_visible(By.CSS_SELECTOR, "main input[aria-label]")
        _typing_in(phone, search)
        search.send_keys(t("roles.software-engineer")[:6])
        time.sleep(0.5)
        mobile.assert_tappable(phone, page.find(*OnboardingPage.SUBMIT), "Continue, while searching roles")

    def test_map_can_be_tapped_on_a_phone(self, phone, wizard):
        page = wizard
        page.pick_role()
        for step in ("teach", "learn", "interests", "summary", "days"):
            page.continue_to(step)
        page.check_option(t("onboarding.days.weekdays"))
        page.continue_to("time")
        page.check_option(t("onboarding.time.evenings"))
        page.continue_to("place")

        mobile.assert_tappable(phone, page.find_visible(*OnboardingPage.MAP), "map")
        page.pick_place_on_map()
        page.continue_to("expectations")


# --- bottom sheets ----------------------------------------------------------------------------


class TestBottomSheets:
    def test_start_kvintet_sheet_stays_above_the_keyboard(self, signed_in_phone):
        """#106 / #115: the sheet docks to the bottom and rides above the keyboard while typing."""
        phone, _, api = signed_in_phone
        dialog = FeedPage(phone).open().wait_loaded().open_start_dialog()
        sheet = _visible_dialog(phone)
        time.sleep(0.5)

        screen_height = phone.execute_script("return window.innerHeight")
        assert abs(mobile.rect(phone, sheet)["bottom"] - screen_height) <= 1, "sheet should dock to the bottom"
        _sweep(phone, scope=sheet)

        proposal = generate_random_proposal("py-phone-sheet")
        for name, value in (("title", proposal["title"]), ("description", proposal["description"])):
            field = dialog.field(name, scope=DIALOG)
            _typing_in(phone, field)
            field.send_keys(value)

            visible = mobile.visible_area(phone)
            box = mobile.rect(phone, sheet)
            assert box["bottom"] <= visible["bottom"] + 1, f"sheet goes under the keyboard while typing the {name}"
            assert box["top"] >= visible["top"] - 1, f"sheet top is cut off while typing the {name}"
            mobile.assert_tappable(phone, phone.find_element(*dialog.SUBMIT), "Start kvintet, with the keyboard open")
            mobile.assert_tappable(
                phone, phone.find_element(*button(t("kvintet.dialog.cancel"), scope=DIALOG)), "Cancel, with the keyboard open"
            )
            title = phone.find_element(By.XPATH, f"{DIALOG}//h2")
            mobile.assert_tappable(phone, title, "the sheet's title, with the keyboard open")

        dialog.toggle_category(proposal["category_label"])  # tapped while the keyboard is still up
        phone.find_element(*dialog.SUBMIT).click()
        OverviewPage(phone).wait_for_heading(t("overview.forming.heading"))
        assert api.get_my_kvintet().json()["title"] == proposal["title"]

    def test_swipe_down_dismisses_a_sheet_and_a_short_swipe_does_not(self, phone, phone_login, scenario):
        """#113: drag a phone sheet down to dismiss it; a small drag snaps back."""
        _, _, people = scenario.forming_kvintet(2)
        phone_login(people[0][1])
        overview = OverviewPage(phone).open()
        overview.wait_for_heading(t("overview.forming.heading"))
        overview.open_leave_dialog()

        mobile.swipe_down(phone, _visible_dialog(phone), 60)
        time.sleep(0.6)
        assert overview.is_visible(By.XPATH, DIALOG, timeout=1), "a 60px drag should snap back, not dismiss"

        mobile.swipe_down(phone, _visible_dialog(phone), 220)
        overview.wait_until_gone(By.XPATH, DIALOG)
        assert people[0][1].get_my_kvintet().status_code == 200, "dismissing must not leave the kvintet"

    def test_leave_sheet_buttons_are_tappable(self, phone, phone_login, scenario):
        _, _, people = scenario.forming_kvintet(2)
        phone_login(people[0][1])
        overview = OverviewPage(phone).open()
        overview.open_leave_dialog()
        _sweep(phone, scope=_visible_dialog(phone))
        overview.confirm_leave()
        assert people[0][1].get_my_kvintet().status_code != 200

    def test_delete_account_sheet_buttons_are_tappable(self, signed_in_phone):
        phone, _, _ = signed_in_phone
        profile = ProfilePage(phone).open().wait_loaded()
        profile.open_delete_dialog()
        _sweep(phone, scope=_visible_dialog(phone))
        profile.cancel_delete()


# --- kvintet screens --------------------------------------------------------------------------


class TestKvintetScreensOnPhone:
    def test_forming_kvintet_screen(self, phone, phone_login, scenario):
        _, _, people = scenario.forming_kvintet(3)
        phone_login(people[0][1])
        overview = OverviewPage(phone).open()
        overview.wait_for_text(t("overview.forming.canVoteTitle"))
        _sweep(phone)

        vote = phone.find_element(*button(t("overview.forming.voteButton"), scope="//main"))
        mobile.assert_tappable(phone, vote, "Start now")
        vote.click()
        overview.wait_for_text(t("kvintet.vote.voted"))

    def test_kvintet_begins_and_active_screens(self, phone, phone_login, scenario):
        _, _, people = scenario.active_kvintet("py-phone-active")
        phone_login(people[0][1])

        OverviewPage(phone).open().wait_for_url(r"/kvintet/begins")
        time.sleep(1)
        _sweep(phone)

        api = people[0][1]
        api.session.post(api._url("/kvintets/mine/begins-seen"))
        overview = OverviewPage(phone).open()
        overview.wait_for_heading(t("overview.active.heading"))
        _sweep(phone)

    def test_chat_composer_and_send_stay_above_the_keyboard(self, phone, phone_login, scenario):
        _, _, people = scenario.active_kvintet("py-phone-chat")
        phone_login(people[0][1])
        chat = ChatPage(phone).open().wait_loaded()
        _sweep(phone)

        composer = chat.find_visible(*ChatPage.INPUT)
        _typing_in(phone, composer)
        text = f"Z telefonu {int(time.time())}"
        composer.send_keys(text)
        send = chat.find(*ChatPage.SEND)
        mobile.assert_tappable(phone, send, "Send, with the keyboard open")
        send.click()

        sent = chat.wait_for_message(text)
        mobile.assert_tappable(phone, sent, "the message just sent")

    def test_tour_bubble_buttons_are_on_screen(self, phone, phone_login, scenario):
        from ..helpers.api_client import create_onboarded_user

        _, api = create_onboarded_user("py-phone-tour", tour_done=False)
        scenario.clients.append(api)
        phone_login(api)
        OverviewPage(phone).open()

        tour = Tour(phone)
        tour.bubble_text()
        for step in ("next", "next", "done"):
            bubble = phone.find_element(By.XPATH, "//*[@role='status'][.//button]")
            label = t(f"tour.{step}")
            control = bubble.find_element(By.XPATH, f".//button[normalize-space()={xp(label)}]")
            mobile.assert_tappable(phone, control, f"tour '{label}'", reveal=False)
            mobile.assert_tappable(phone, bubble.find_element(By.XPATH, f".//button[@aria-label={xp(t('tour.close'))}]"), "tour close", reveal=False)
            control.click()
            time.sleep(1)
        tour.wait_closed()


# --- the checks themselves --------------------------------------------------------------------


class TestTheLayoutChecksCatchProblems:
    """A green run only means something if the checks can fail. These break the page on purpose."""

    def test_a_covered_button_is_reported(self, phone):
        page = BasePage(phone).open("/login")
        submit = page.find_visible(By.CSS_SELECTOR, "main button[type='submit']")
        phone.execute_script(
            "const r = arguments[0].getBoundingClientRect();"
            "const cover = document.createElement('div');"
            "cover.id = 'test-cover';"
            "Object.assign(cover.style, {position: 'absolute', zIndex: 9999, background: 'red',"
            " left: r.left + 'px', top: (r.top + window.scrollY) + 'px', width: r.width + 'px', height: r.height + 'px'});"
            "document.body.appendChild(cover);",
            submit,
        )
        problems = mobile.tap_problems(phone, submit, reveal=False)
        assert any("covered by <div#test-cover" in p for p in problems), problems

    def test_a_button_under_the_keyboard_is_reported(self, phone):
        page = BasePage(phone).open("/login")
        phone.execute_script(
            "const bar = document.createElement('div');"
            "Object.assign(bar.style, {position: 'fixed', left: 0, right: 0, bottom: 0, height: '60px', zIndex: 50});"
            "bar.innerHTML = '<button id=\"test-low\" style=\"width:100%;height:60px\">low</button>';"
            "document.body.appendChild(bar);"
        )
        _typing_in(phone, page.find_visible(By.NAME, "email"))
        problems = mobile.tap_problems(phone, phone.find_element(By.ID, "test-low"), reveal=False)
        assert any("not fully on screen" in p for p in problems), problems

    def test_horizontal_overflow_is_reported(self, phone):
        BasePage(phone).open("/login")
        phone.execute_script(
            "const wide = document.createElement('div'); wide.style.width = '2000px'; wide.style.height = '1px';"
            "document.body.appendChild(wide);"
        )
        with pytest.raises(AssertionError, match="wider than"):
            mobile.assert_no_horizontal_scroll(phone)
