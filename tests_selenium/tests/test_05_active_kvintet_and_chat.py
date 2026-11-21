from selenium.webdriver.common.by import By
from ..pages.overview_page import OverviewPage
from ..pages.chat_page import ChatPage

class TestActiveKvintetAndChat:
    """Active kvintet group view and chat interaction."""

    def test_active_kvintet_view(self, user_active_kvintet):
        """[ACTIVE-1] Active kvintet displays member names and chat entry."""
        overview_page = OverviewPage(user_active_kvintet)
        overview_page.open()

        assert "Frontend craft circle" in user_active_kvintet.page_source
        assert overview_page.is_visible(*OverviewPage.CHAT_LINK)

    def test_send_chat_message(self, user_active_kvintet):
        """[MSG-1] Sends a message in active kvintet chat."""
        chat_page = ChatPage(user_active_kvintet)
        chat_page.open()

        msg = f"Selenium test message {int(chat_page.driver.execute_script('return Date.now();'))}"
        chat_page.send_message(msg)

        assert chat_page.message_exists(msg)

    def test_chat_whitespace_message_blocked(self, user_active_kvintet):
        """[MSG-5] Whitespace message cannot be submitted."""
        chat_page = ChatPage(user_active_kvintet)
        chat_page.open()

        chat_page.send_keys(*ChatPage.MESSAGE_INPUT, "   ")
        send_btn = chat_page.find(*ChatPage.SEND_BUTTON)
        assert not send_btn.is_enabled()

    def test_chat_xss_protection(self, user_active_kvintet):
        """[MSG-6 / Security] XSS payload is safely encoded and displayed as plain text."""
        chat_page = ChatPage(user_active_kvintet)
        chat_page.open()

        xss = "<b id='xss-test'>safe_text</b>"
        chat_page.send_message(xss)

        # Verify that safe_text is present
        assert chat_page.message_exists("safe_text")

        # Verify the HTML was not injected into DOM as an actual <b> tag with id='xss-test'
        injected = user_active_kvintet.find_elements(By.ID, "xss-test")
        assert len(injected) == 0, "XSS HTML was improperly injected into DOM"
