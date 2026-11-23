"""Active kvintet: 'Kvintet begins' (#94), the group view (#50, #93) and group chat (#52, #96)."""

import time

import pytest

from ..helpers.i18n import t
from ..helpers.test_data import FRONTEND_URL
from ..pages.base_page import link
from ..pages.chat_page import ChatPage
from ..pages.overview_page import OverviewPage


@pytest.fixture
def active_member(driver, login_as, scenario):
    """Signs in the first member of a fresh active kvintet. Returns (proposal, people)."""
    _, proposal, people = scenario.active_kvintet()
    login_as(people[0][1])
    return proposal, people


def _messages(api):
    resp = api.session.get(api._url("/kvintets/mine/messages"))
    resp.raise_for_status()
    body = resp.json()
    return body["items"] if isinstance(body, dict) else body


class TestActiveKvintet:
    def test_fifth_member_starts_the_kvintet(self, driver, active_member):
        proposal, people = active_member
        overview = OverviewPage(driver).open()

        # The first visit after the start shows 'Kvintet begins' once.
        overview.wait_for_url(r"/kvintet/begins")
        overview.wait_for_text(t("kvintet.begins.title.five"))
        assert proposal["title"] in driver.find_element("tag name", "main").text

        overview.click(*link("/overview", scope="//main"))
        overview.wait_for_heading(t("overview.active.heading"))

        driver.get(f"{FRONTEND_URL}/overview")
        overview.wait_for_heading(t("overview.active.heading"))  # not 'begins' again

    def test_active_view_reveals_member_names(self, driver, active_member):
        _, people = active_member
        people[0][1].session.post(people[0][1]._url("/kvintets/mine/begins-seen"))
        overview = OverviewPage(driver).open()

        overview.wait_for_heading(t("overview.active.heading"))
        overview.wait_for_text(t("overview.active.membersHeading"))
        text = overview.main_text()
        for user, _ in people[1:]:
            assert user["name"] in text

    def test_begins_page_links_to_the_group_chat(self, driver, active_member):
        page = OverviewPage(driver).open("/kvintet/begins")
        page.click(*link("/kvintet/messages", scope="//main"))
        ChatPage(driver).wait_loaded()


class TestChat:
    def test_message_reaches_the_other_members(self, driver, active_member):
        _, people = active_member
        chat = ChatPage(driver).open().wait_loaded()

        text = f"Ahoj, test zprava {int(time.time())}"
        chat.send(text)

        chat.wait_for_message(text)
        assert chat.input_value() == ""
        assert any(m["body"] == text for m in _messages(people[1][1]))

    def test_enter_sends_the_message(self, driver, active_member):
        chat = ChatPage(driver).open().wait_loaded()
        text = f"Odeslano enterem {int(time.time())}"
        chat.send_with_enter(text)
        chat.wait_for_message(text)

    def test_message_from_another_member_appears(self, driver, active_member):
        """No websockets: the chat polls, so a message posted elsewhere shows up on its own."""
        _, people = active_member
        chat = ChatPage(driver).open().wait_loaded()

        text = f"Zprava od kolegy {int(time.time())}"
        assert people[2][1].send_message(text).status_code in (200, 201)
        chat.find_visible(*_message(text), timeout=30)

    def test_whitespace_only_message_is_not_sent(self, driver, active_member):
        _, people = active_member
        chat = ChatPage(driver).open().wait_loaded()
        before = chat.message_count()

        chat.send("    ")
        time.sleep(1.5)

        assert chat.message_count() == before
        assert all(m["kind"] == "SYSTEM" for m in _messages(people[0][1]))

    def test_html_in_messages_is_shown_as_text(self, driver, active_member):
        chat = ChatPage(driver).open().wait_loaded()
        payload = "<b id='xss-probe'>bold?</b><img src=x onerror=\"window.__xss=1\">"
        chat.send(payload)

        chat.wait_for_message("<b id='xss-probe'>")
        assert driver.find_elements("id", "xss-probe") == []
        assert driver.execute_script("return window.__xss") is None

    def test_non_member_cannot_open_a_group_chat(self, driver, fresh_user):
        driver.get(f"{FRONTEND_URL}/kvintet/messages")
        page = ChatPage(driver)
        page.wait_for_url(r"/(overview|kvintet/feed)")
        assert driver.find_elements(*ChatPage.INPUT) == []

    def test_chat_api_is_closed_to_non_members(self, fresh_user):
        _, api = fresh_user
        assert api.send_message("hello?").status_code in (403, 404)


def _message(text):
    from selenium.webdriver.common.by import By

    from ..helpers.i18n import xp

    return (By.XPATH, f"//main//li[contains(normalize-space(), {xp(text)})]")
