from selenium.webdriver.common.by import By
from .base_page import BasePage

class AdminPage(BasePage):
    HEADING = (By.XPATH, "//h1[contains(., 'Přehled pilotu')]")
    REGISTERED_CARD = (By.XPATH, "//*[contains(., 'Registrovaní')]")
    ONBOARDED_CARD = (By.XPATH, "//*[contains(., 'Dokončili profil')]")
    ACTIVE_CARD = (By.XPATH, "//*[contains(., 'Dnes aktivní uživatelé')]")
    KVINTETS_CARD = (By.XPATH, "//*[contains(., 'Kvintety')]")

    def open(self):
        return super().open("/admin")
