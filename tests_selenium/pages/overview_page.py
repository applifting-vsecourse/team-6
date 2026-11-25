from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import DIALOG, BasePage, button


class OverviewPage(BasePage):
    path = "/overview"
    HEADING = (By.CSS_SELECTOR, "main h1")

    def heading(self):
        return self.find_visible(*self.HEADING).text

    def wait_for_heading(self, text):
        self.find_visible(By.XPATH, f"//main//h1[normalize-space()={xp(text)}]")

    def main_text(self):
        return self.find_visible(By.TAG_NAME, "main").text

    # --- forming kvintet --------------------------------------------------

    def vote(self):
        self.click(*button(t("overview.forming.voteButton"), scope="//main"))

    def can_vote(self, timeout=3):
        return self.is_visible(*button(t("overview.forming.voteButton"), scope="//main"), timeout=timeout)

    # --- leaving ----------------------------------------------------------

    def open_leave_dialog(self):
        self.click(*button(t("overview.forming.leaveKvintet"), scope="//main"))
        return self.find_visible(By.XPATH, DIALOG)

    def confirm_leave(self, active=False):
        label = t("kvintet.dialog.confirmLeaveActive" if active else "kvintet.dialog.confirmLeave")
        self.click(*button(label, scope=DIALOG))
        self.wait_until_gone(By.XPATH, DIALOG)

    def cancel_leave(self):
        self.click(*button(t("kvintet.dialog.cancel"), scope=DIALOG))
        self.wait_until_gone(By.XPATH, DIALOG)

    # --- no kvintet -------------------------------------------------------

    def join(self, title):
        card = self.find_visible(By.XPATH, f"//main//*[.//h3[normalize-space()={xp(title)}]][.//button][1]")
        self.click_element(card.find_element(*button(t("overview.noKvintet.join"), scope=".")))
