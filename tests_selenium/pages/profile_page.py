from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import DIALOG, BasePage, button


class ProfilePage(BasePage):
    path = "/profile"

    def wait_loaded(self):
        self.find_visible(By.XPATH, f"//main//h2[normalize-space()={xp(t('profile.sections.whenAndWhere'))}]")
        return self

    def name_heading(self):
        return self.find_visible(By.CSS_SELECTOR, "main h1").text

    def section_text(self, heading):
        """Text of the profile section under the <h2> `heading`."""
        h2 = self.find_visible(By.XPATH, f"//main//h2[normalize-space()={xp(heading)}]")
        return h2.find_element(By.XPATH, "./ancestor::section[1] | ./../..").text

    def edit_section(self, heading):
        self.click(By.XPATH, f"//main//h2[normalize-space()={xp(heading)}]/following::a[1]")

    def open_delete_dialog(self):
        self.click(*button(t("profile.dangerZone.button"), scope="//main"))
        return self.find_visible(By.XPATH, DIALOG)

    def confirm_delete(self):
        self.click(*button(t("account.deleteDialog.confirm"), scope=DIALOG))

    def cancel_delete(self):
        self.click(*button(t("account.deleteDialog.cancel"), scope=DIALOG))
        self.wait_until_gone(By.XPATH, DIALOG)
