"""The real iOS keyboard, in real Safari on the iOS Simulator (#115 and the phone forms).

Opt-in: `pnpm test:ios` (pytest --ios). Each test taps a field, waits for iOS to report its
keyboard on screen, and checks against Safari's real visual viewport that the field and the
controls you need while typing are reachable above the keyboard and not covered. Every test
is recorded to tests_selenium/artifacts/ios/<test>.mp4, with screenshots of the key moments.
"""

import time

import pytest
from selenium.webdriver.common.by import By

from ..helpers import ios, mobile
from ..helpers.api_client import SESSION_COOKIE, ApiClient
from ..helpers.i18n import t, xp
from ..helpers.test_data import FRONTEND_URL, generate_random_proposal, generate_random_user
from ..pages.base_page import DIALOG, BasePage, button

pytestmark = pytest.mark.ios


def _sign_in(drv, api):
    drv.get(FRONTEND_URL)
    drv.add_cookie({"name": SESSION_COOKIE, "value": api.session_token, "path": "/"})


def _open(drv, path):
    page = BasePage(drv, timeout=20)
    for attempt in range(2):
        page.open(path)
        page.find_visible(By.CSS_SELECTOR, "main h1")
        if drv.current_url.replace(FRONTEND_URL, "", 1) == path:
            break
        ios.dismiss_system_prompts(drv)  # a system sheet can swallow the navigation
    else:
        raise AssertionError(f"Safari did not open {path}; it is on {drv.current_url}")
    time.sleep(1.5)  # the simulator is slow; let data load and the layout settle
    ios.dismiss_system_prompts(drv)
    ios.install_viewport_probe(drv)
    return page


def _tap_field(drv, field, label):
    """A real tap on a text field: iOS focuses it and slides the keyboard up.

    Then the field must be at least partly visible above the keyboard, where the caret is.
    (Safari scrolls a tall textarea only far enough to show the line being typed, so a tall
    field may be clipped at its top; that is Safari, not the app.)
    """
    ios.tap(drv, field)
    ios.wait_for_keyboard(drv, shown=True)
    ios.install_viewport_probe(drv)
    assert drv.execute_script("return document.activeElement === arguments[0]", field), f"the {label} field did not get focus"
    drv.recorder.shot(f"keyboard-{label}")
    box = mobile.rect(drv, field)
    visible = drv.execute_script("return window.__kvVisible()")
    shown = min(box["bottom"], visible["bottom"]) - max(box["top"], visible["top"])
    assert shown >= min(30, box["bottom"] - box["top"]), (
        f"the focused {label} field is hidden: field y={box['top']:.0f}..{box['bottom']:.0f}, "
        f"visible area above the keyboard y={visible['top']:.0f}..{visible['bottom']:.0f}"
    )


def _assert_reachable_while_typing(drv, element, label):
    """The control can be scrolled into the part of the screen above the keyboard, uncovered."""
    assert ios.keyboard_shown(drv), "the keyboard closed before the check"
    mobile.assert_tappable(drv, element, f"{label}, with the iOS keyboard open")


def _dismiss_keyboard(drv):
    drv.execute_script("document.activeElement && document.activeElement.blur()")
    ios.wait_for_keyboard(drv, shown=False)


class TestRealKeyboardOnIos:
    def test_sign_in_with_the_keyboard_up(self, ios_safari, scenario):
        drv = ios_safari
        user, _ = scenario.user("py-ios-login")
        page = _open(drv, "/login")
        drv.recorder.shot("login")
        submit = page.find_visible(By.CSS_SELECTOR, "main button[type='submit']")

        email = page.find_visible(By.NAME, "email")
        _tap_field(drv, email, "email")
        email.send_keys(user["email"])
        _assert_reachable_while_typing(drv, submit, "Sign in")

        password = page.find_visible(By.NAME, "password")
        _tap_field(drv, password, "password")
        password.send_keys(user["password"])
        _assert_reachable_while_typing(drv, submit, "Sign in")
        drv.recorder.shot("ready-to-submit")

        submit.click()
        page.wait_for_url(r"/overview", timeout=20)
        time.sleep(1)
        drv.recorder.shot("signed-in")

    def test_sign_up_form_with_the_keyboard_up(self, ios_safari):
        drv = ios_safari
        user = generate_random_user("py-ios-signup")
        page = _open(drv, "/signup")
        submit = page.find(By.CSS_SELECTOR, "main button[type='submit']")
        consent = page.find(By.CSS_SELECTOR, "main button[role='checkbox']")

        for name in ("name", "username", "email"):
            field = page.field(name)
            _tap_field(drv, field, name)
            field.send_keys(user[name])
            _assert_reachable_while_typing(drv, consent, "the community-rules checkbox")
            _assert_reachable_while_typing(drv, submit, "Create account")

        # A new-password field makes iOS offer a strong password from iCloud Keychain instead of
        # its keyboard; the simulator has no Keychain, so no keyboard appears there. Typing a
        # password with the keyboard up is covered by the sign-in test.
        _dismiss_keyboard(drv)
        for name in ("password", "passwordConfirmation"):
            page.field(name).send_keys(user["password"])

        consent.click()
        submit.click()
        page.wait_for_url(r"/onboarding", timeout=20)
        drv.recorder.shot("registered")
        api = ApiClient()
        api.sign_in(user["email"], user["password"])
        api.delete_account()

    def test_start_kvintet_sheet_rides_above_the_keyboard(self, ios_safari, scenario):
        """#115: the bottom sheet sits on top of the keyboard while typing, never behind it."""
        drv = ios_safari
        _, api = scenario.user("py-ios-sheet")
        _sign_in(drv, api)
        page = _open(drv, "/kvintet/feed")
        page.click(*button(t("kvintet.startOwn.button"), scope="//main"))
        sheet = page.find_visible(By.XPATH, DIALOG)
        time.sleep(0.8)
        drv.recorder.shot("sheet-open")

        proposal = generate_random_proposal("py-ios-sheet")
        for name, value in (("title", proposal["title"]), ("description", proposal["description"])):
            field = page.field(name, scope=DIALOG)
            _tap_field(drv, field, name)
            field.send_keys(value)

            visible = drv.execute_script("return window.__kvVisible()")
            box = mobile.rect(drv, sheet)
            assert box["bottom"] <= visible["bottom"] + 1, (
                f"sheet goes behind the keyboard while typing the {name}: sheet bottom {box['bottom']:.0f}, "
                f"keyboard starts at {visible['bottom']:.0f}"
            )
            for label, locator in (
                ("Start kvintet", (By.XPATH, f"{DIALOG}//button[@type='submit']")),
                ("Cancel", button(t("kvintet.dialog.cancel"), scope=DIALOG)),
            ):
                _assert_reachable_while_typing(drv, drv.find_element(*locator), label)
            drv.recorder.shot(f"sheet-typing-{name}")

        page.click(*button(proposal["category_label"], scope=DIALOG))
        page.click(By.XPATH, f"{DIALOG}//button[@type='submit']")
        page.wait_for_url(r"/overview", timeout=20)
        time.sleep(1)
        drv.recorder.shot("kvintet-started")
        assert api.get_my_kvintet().json()["title"] == proposal["title"]

    def test_chat_send_button_with_the_keyboard_up(self, ios_safari, scenario):
        drv = ios_safari
        _, _, people = scenario.active_kvintet("py-ios-chat")
        api = people[0][1]
        api.session.post(api._url("/kvintets/mine/begins-seen"))
        _sign_in(drv, api)
        page = _open(drv, "/kvintet/messages")
        drv.recorder.shot("chat")

        composer = page.find_visible(By.ID, "chat-message")
        _tap_field(drv, composer, "message")
        text = f"Ahoj z iPhonu {int(time.time())}"
        composer.send_keys(text)
        send = page.find(By.CSS_SELECTOR, "main button[type='submit']")
        _assert_reachable_while_typing(drv, send, "Send")
        drv.recorder.shot("chat-typing")

        send.click()
        sent = page.find_visible(By.XPATH, f"//main//li[contains(normalize-space(), {xp(text)})]")
        time.sleep(0.8)
        ios.install_viewport_probe(drv)
        mobile.assert_tappable(drv, sent, "the message just sent")
        drv.recorder.shot("chat-sent")

    def test_onboarding_note_with_the_keyboard_up(self, ios_safari, scenario):
        drv = ios_safari
        user = generate_random_user("py-ios-onb")
        api = ApiClient()
        assert api.sign_up(user["email"], user["password"], user["name"], user["username"]).status_code == 200
        scenario.clients.append(api)
        # Everything but the last page answered, so the wizard can open on the note.
        api.session.put(
            api._url("/me/profile"),
            json={
                "roles": ["software-engineer"], "weekdays": True, "evenings": True,
                "cityId": "city_praha", "radiusKm": 25, "latitude": 50.08, "longitude": 14.42,
                "meetingFrequency": "WEEKLY",
            },
        ).raise_for_status()
        _sign_in(drv, api)
        page = _open(drv, "/onboarding?page=note")

        note = page.find_visible(By.CSS_SELECTOR, "main textarea")
        _tap_field(drv, note, "note")
        note.send_keys("Psáno na iPhonu s klávesnicí")
        done = page.find(By.CSS_SELECTOR, "main button[type='submit']")
        _assert_reachable_while_typing(drv, done, t("common.finish"))
        drv.recorder.shot("note-typing")

        done.click()
        page.wait_for_url(r"/overview", timeout=20)
        time.sleep(1)
        drv.recorder.shot("onboarded")
        assert api.get_profile()["note"] == "Psáno na iPhonu s klávesnicí"
