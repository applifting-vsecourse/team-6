from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import BasePage

BUBBLE = "//*[@role='status'][.//button]"


class Tour(BasePage):
    """The mascot's product tour bubble."""

    def bubble_text(self, timeout=None):
        return self.find_visible(By.XPATH, BUBBLE, timeout=timeout).text

    # A tour step has Next or Done. After the tour the mascot stays as the user's
    # avatar with only a hint button, which is not a step.
    STEP = (By.XPATH, f"{BUBBLE}[.//button[normalize-space()={xp(t('tour.next'))} or normalize-space()={xp(t('tour.done'))}]]")

    def is_showing(self, timeout=3):
        return self.is_visible(*self.STEP, timeout=timeout)

    def wait_closed(self):
        self.wait_until_gone(*self.STEP)

    def next(self):
        self.click(By.XPATH, f"{BUBBLE}//button[normalize-space()={xp(t('tour.next'))}]")

    def done(self):
        self.click(By.XPATH, f"{BUBBLE}//button[normalize-space()={xp(t('tour.done'))}]")

    def close(self):
        self.click(By.XPATH, f"{BUBBLE}//button[@aria-label={xp(t('tour.close'))}]")
