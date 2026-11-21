import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class OnboardingPage(BasePage):
    CONTINUE_BUTTON = (By.XPATH, "//button[contains(., 'Pokračovat') or contains(., 'Na krok') or contains(., 'Hotovo')]")
    BACK_BUTTON = (By.XPATH, "//button[contains(., 'Zpět')]")
    FINISH_BUTTON = (By.XPATH, "//button[contains(., 'Hotovo') or contains(., 'Dokončit')]")

    def open(self):
        return super().open("/onboarding")

    def select_role(self, category_pattern="Technologie a vývoj", role_pattern="Frontend vývojář"):
        cat_btn = self.find(By.XPATH, f"//button[contains(., '{category_pattern}')]")
        cat_btn.click()
        time.sleep(0.3)
        role_btn = self.find(By.XPATH, f"//button[contains(., '{role_pattern}')]")
        role_btn.click()

    def select_choice_tile(self, label_pattern):
        tile = self.find(By.XPATH, f"//*[contains(., '{label_pattern}') and not(self::p)]")
        tile.click()

    def select_frequency(self, freq_pattern="týdně"):
        radio = self.find(By.XPATH, f"//*[@role='radio' or self::label][contains(., '{freq_pattern}')]")
        radio.click()

    def select_map_location(self):
        map_el = self.find(By.CSS_SELECTOR, "[data-testid='location-map-container'], .leaflet-container")
        map_el.click()
        time.sleep(0.5)

    def fill_note(self, text):
        textarea = self.find(By.CSS_SELECTOR, "textarea")
        textarea.clear()
        textarea.send_keys(text)

    def click_continue(self):
        btn = self.find(*self.CONTINUE_BUTTON)
        try:
            btn.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", btn)
        time.sleep(0.6)

    def click_finish(self):
        btn = self.find(*self.FINISH_BUTTON)
        try:
            btn.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", btn)
        time.sleep(1)
