import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class ChatPage(BasePage):
    MESSAGE_INPUT = (By.CSS_SELECTOR, "textarea[placeholder*='zprávu'], input[placeholder*='zprávu']")
    SEND_BUTTON = (By.XPATH, "//button[contains(., 'Odeslat') or contains(@aria-label, 'Odeslat')]")

    def open(self):
        return super().open("/kvintet/messages")

    def send_message(self, text: str):
        self.send_keys(*self.MESSAGE_INPUT, text)
        self.click(*self.SEND_BUTTON)
        time.sleep(1)

    def message_exists(self, text: str):
        xpath = f"//*[contains(text(), '{text}')]"
        return self.is_visible(By.XPATH, xpath, timeout=5)
