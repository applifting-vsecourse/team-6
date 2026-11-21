from selenium.webdriver.common.by import By
from .base_page import BasePage

class ProfilePage(BasePage):
    DELETE_ACCOUNT_BTN = (By.XPATH, "//button[contains(., 'Smazat účet')]")
    DELETE_DIALOG = (By.XPATH, "//*[@role='dialog'][contains(., 'Smazat účet')]")
    CONFIRM_DELETE_BTN = (By.XPATH, "//*[@role='dialog']//button[contains(., 'Smazat účet') or contains(@class, 'bg-destructive')]")
    CANCEL_DELETE_BTN = (By.XPATH, "//*[@role='dialog']//button[contains(., 'Zrušit')]")

    def open(self):
        return super().open("/profile")

    def open_delete_dialog(self):
        self.click(*self.DELETE_ACCOUNT_BTN)
        self.find_visible(*self.DELETE_DIALOG)

    def cancel_delete(self):
        self.click(*self.CANCEL_DELETE_BTN)
