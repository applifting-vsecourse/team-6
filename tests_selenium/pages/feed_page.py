import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class FeedPage(BasePage):
    HEADING = (By.XPATH, "//h1[contains(., 'Vyberte si kvintet')]")
    START_KVINTET_BTN = (By.XPATH, "//button[contains(., 'Založit kvintet') or contains(., 'Založit vlastní')]")
    CARDS = (By.CSS_SELECTOR, "article, .rounded-lg.border")
    
    # Start Kvintet Modal
    START_DIALOG = (By.XPATH, "//*[@role='dialog'][contains(., 'Založit kvintet')]")
    DIALOG_TITLE_INPUT = (By.XPATH, "//*[@role='dialog']//input[@name='title' or contains(@placeholder, 'název')]")
    DIALOG_DESC_INPUT = (By.XPATH, "//*[@role='dialog']//textarea[@name='description']")
    DIALOG_SUBMIT_BTN = (By.XPATH, "//*[@role='dialog']//button[@type='submit'][contains(., 'Založit')]")
    DIALOG_CANCEL_BTN = (By.XPATH, "//*[@role='dialog']//button[contains(., 'Zrušit')]")
    
    TITLE_ERROR = (By.XPATH, "//*[@role='dialog']//p[contains(@id, 'title-form-item-message')]")
    DESC_ERROR = (By.XPATH, "//*[@role='dialog']//p[contains(@id, 'description-form-item-message')]")

    def open(self):
        return super().open("/kvintet/feed")

    def open_start_dialog(self):
        self.click(*self.START_KVINTET_BTN)
        self.find_visible(*self.START_DIALOG)

    def select_dialog_category(self, category_pattern="Data a AI"):
        cat_btn = self.find(By.XPATH, f"//*[@role='dialog']//button[contains(., '{category_pattern}')]")
        cat_btn.click()

    def fill_and_submit_proposal(self, title: str, description: str, category="Data a AI"):
        self.send_keys(*self.DIALOG_TITLE_INPUT, title)
        if category:
            self.select_dialog_category(category)
        self.send_keys(*self.DIALOG_DESC_INPUT, description)
        self.click(*self.DIALOG_SUBMIT_BTN)
        time.sleep(1)
