from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from ..helpers.i18n import t, xp
from .base_page import BasePage


class ChatPage(BasePage):
    path = "/kvintet/messages"
    INPUT = (By.ID, "chat-message")
    SEND = (By.CSS_SELECTOR, "main button[type='submit']")
    MESSAGES = (By.CSS_SELECTOR, "main li")

    def wait_loaded(self):
        self.find_visible(*self.INPUT)
        self.wait_for_text(t("chat.system.kvintetStarted"))
        return self

    def write(self, text):
        self.type(*self.INPUT, text)

    def send(self, text):
        self.write(text)
        self.click(*self.SEND)

    def send_with_enter(self, text):
        self.write(text)
        self.find(*self.INPUT).send_keys(Keys.ENTER)

    def message_count(self):
        return len(self.find_all_visible(*self.MESSAGES))

    def wait_for_message(self, text):
        return self.find_visible(By.XPATH, f"//main//li[contains(normalize-space(), {xp(text)})]")

    def input_value(self):
        return self.find(*self.INPUT).get_attribute("value")
