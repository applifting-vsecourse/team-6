import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class OverviewPage(BasePage):
    HEADING = (By.CSS_SELECTOR, "h1")
    FORMING_HEADING = (By.XPATH, "//h1[contains(., 'Kvintet se skládá') or contains(., 'Váš kvintet')]")
    VOTE_BUTTON = (By.XPATH, "//button[contains(., 'Hlasovat pro start') or contains(., 'Odvolat hlas')]")
    LEAVE_BUTTON = (By.XPATH, "//button[contains(., 'Opustit kvintet')]")
    START_OWN_BUTTON = (By.XPATH, "//button[contains(., 'Založit vlastní') or contains(., 'Založit kvintet')]")
    CHAT_LINK = (By.XPATH, "//a[@href='/kvintet/messages' or contains(., 'Přejít do chatu')]")

    # Leave Dialog
    LEAVE_DIALOG = (By.XPATH, "//*[@role='dialog'][contains(., 'Opustit kvintet')]")
    LEAVE_CONFIRM_BTN = (By.XPATH, "//*[@role='dialog']//button[contains(., 'Opustit kvintet') or contains(@class, 'bg-destructive')]")
    LEAVE_CANCEL_BTN = (By.XPATH, "//*[@role='dialog']//button[contains(., 'Zůstat') or contains(., 'Zrušit')]")

    def open(self):
        return super().open("/overview")

    def vote_to_start(self):
        self.click(*self.VOTE_BUTTON)
        time.sleep(1)

    def open_leave_dialog(self):
        self.click(*self.LEAVE_BUTTON)
        self.find_visible(*self.LEAVE_DIALOG)

    def confirm_leave(self):
        self.click(*self.LEAVE_CONFIRM_BTN)
        time.sleep(1)

    def cancel_leave(self):
        self.click(*self.LEAVE_CANCEL_BTN)
        time.sleep(0.5)
