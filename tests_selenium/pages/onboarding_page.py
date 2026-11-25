from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import BasePage

# The order of the wizard pages (?page=...).
PAGES = [
    "role", "teach", "learn", "interests", "summary",
    "days", "time", "place", "expectations", "frequency", "note",
]


class OnboardingPage(BasePage):
    path = "/onboarding"
    SUBMIT = (By.CSS_SELECTOR, "main button[type='submit']")
    CATEGORY_BUTTONS = (By.CSS_SELECTOR, "main button[aria-pressed]")
    MAP = (By.CSS_SELECTOR, "[data-testid='location-map-container']")
    NOTE = (By.CSS_SELECTOR, "main textarea")

    @property
    def current_page(self):
        url = self.driver.current_url
        return url.split("page=", 1)[1].split("&", 1)[0] if "page=" in url else None

    def wait_for_page(self, page):
        self.wait_for_url(rf"[?&]page={page}(&|$)")

    def continue_(self):
        self.click(*self.SUBMIT)

    def continue_to(self, page):
        self.continue_()
        self.wait_for_page(page)

    def validation_message(self):
        """The guide's 'problem' message shown when Continue is blocked."""
        return self.find_visible(By.CSS_SELECTOR, "main [role='alert'], main [data-slot='form-message']").text

    # --- answers ----------------------------------------------------------

    def pick_role(self, role_name=None):
        """Opens the first field and picks `role_name` (or its first role)."""
        self.click(By.CSS_SELECTOR, "main button[aria-pressed]")  # first field
        if role_name:
            label = t("onboarding.role.addRole", name=role_name)
            self.click(By.CSS_SELECTOR, f"main button[aria-label={xp(label)}]")
        else:
            prefix = t("onboarding.role.addRole", name="")
            self.click(By.XPATH, f"(//main//button[starts-with(@aria-label, {xp(prefix)})])[1]")

    def add_tag(self, category_label, tag_name):
        self.click(By.XPATH, f"//main//button[@aria-pressed][normalize-space()={xp(category_label)}]")
        self.click(By.CSS_SELECTOR, f"main button[aria-label={xp(t('onboarding.tags.addTag', name=tag_name))}]")

    def check_option(self, label_text):
        """Ticks the checkbox / radio whose <label> reads `label_text`."""
        self.click(
            By.XPATH,
            f"//main//label[normalize-space()={xp(label_text)}]//button[@role='checkbox' or @role='radio']",
        )

    def pick_place_on_map(self):
        """Leaflet reads the pointer position, so this needs a real click, not a JS one."""
        map_el = self.find_visible(*self.MAP)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", map_el)
        ActionChains(self.driver).move_to_element(map_el).click().perform()

    def choose_radius(self, km):
        self.click(*_button_text(t("onboarding.place.radiusOption", count=km)))

    def write_note(self, text):
        self.type(*self.NOTE, text)

    def complete(self, note="Selenium note"):
        """Walks the whole wizard from the role page with minimal valid answers."""
        self.wait_for_page("role")
        self.pick_role()
        for page in ("teach", "learn", "interests", "summary", "days"):
            self.continue_to(page)
        self.check_option(t("onboarding.days.weekdays"))
        self.continue_to("time")
        self.check_option(t("onboarding.time.evenings"))
        self.continue_to("place")
        self.pick_place_on_map()
        self.continue_to("expectations")
        self.continue_to("frequency")
        self.check_option(t("onboarding.frequency.weekly"))
        self.continue_to("note")
        if note:
            self.write_note(note)
        self.continue_()


def _button_text(text):
    return (By.XPATH, f"//main//button[normalize-space()={xp(text)}]")
