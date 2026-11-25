from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import BasePage


class AdminPage(BasePage):
    path = "/admin"

    def wait_loaded(self):
        self.find_visible(By.XPATH, f"//main//h1[normalize-space()={xp(t('admin.title'))}]")
        return self
