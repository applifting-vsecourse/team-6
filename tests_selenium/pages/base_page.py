from selenium.common.exceptions import (
    ElementClickInterceptedException,
    ElementNotInteractableException,
    TimeoutException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from ..helpers.i18n import t, xp
from ..helpers.test_data import FRONTEND_URL


def button(text, scope=""):
    """XPath of a <button> whose visible text is exactly `text`."""
    return (By.XPATH, f"{scope}//button[normalize-space()={xp(text)}]")


def link(href, scope=""):
    return (By.XPATH, f"{scope}//a[@href={xp(href)}]")


def text_on_page(text):
    """XPath of the innermost element containing `text`."""
    return (By.XPATH, f"//body//*[contains(normalize-space(), {xp(text)}) and not(*[contains(normalize-space(), {xp(text)})])]")


DIALOG = "//*[@role='dialog']"


def wait_for_js(driver, condition_js, message, timeout=10):
    """Waits until the JS body `condition_js` (with a `return`) is truthy; fails with `message`."""
    try:
        WebDriverWait(driver, timeout, poll_frequency=0.1).until(lambda d: d.execute_script(condition_js))
    except TimeoutException:
        raise AssertionError(message) from None


class BasePage:
    path = "/"

    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.timeout = timeout

    # --- navigation -------------------------------------------------------

    def open(self, path=None):
        self.driver.get(f"{FRONTEND_URL}{path if path is not None else self.path}")
        return self

    def wait_for_url(self, pattern, timeout=None):
        """Waits until the current URL matches the regex `pattern` (re.search)."""
        WebDriverWait(self.driver, timeout or self.timeout).until(EC.url_matches(pattern))

    @property
    def path_and_query(self):
        return self.driver.current_url.replace(FRONTEND_URL, "", 1)

    # --- finding ----------------------------------------------------------

    def find(self, by, value, timeout=None):
        return WebDriverWait(self.driver, timeout or self.timeout).until(
            EC.presence_of_element_located((by, value))
        )

    def find_visible(self, by, value, timeout=None):
        return WebDriverWait(self.driver, timeout or self.timeout).until(
            EC.visibility_of_element_located((by, value))
        )

    def find_all_visible(self, by, value):
        return [e for e in self.driver.find_elements(by, value) if e.is_displayed()]

    def is_visible(self, by, value, timeout=3):
        try:
            self.find_visible(by, value, timeout)
            return True
        except TimeoutException:
            return False

    def wait_until_gone(self, by, value, timeout=None):
        WebDriverWait(self.driver, timeout or self.timeout).until(
            EC.invisibility_of_element_located((by, value))
        )

    def wait_for_text(self, text, timeout=None):
        """Waits until `text` is visible anywhere on the page and returns that element."""
        return self.find_visible(*text_on_page(text), timeout=timeout)

    def has_text(self, text, timeout=3):
        return self.is_visible(*text_on_page(text), timeout=timeout)

    # --- acting -----------------------------------------------------------

    def click(self, by, value, timeout=None):
        element = WebDriverWait(self.driver, timeout or self.timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        self.click_element(element)
        return element

    def click_element(self, element):
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", element)
        try:
            element.click()
        except (ElementClickInterceptedException, ElementNotInteractableException):
            # Something animates over it (mascot bubble, sheet transition): click it directly.
            self.driver.execute_script("arguments[0].click()", element)

    def type(self, by, value, text, clear=True):
        element = self.find_visible(by, value)
        if clear:
            element.clear()
        element.send_keys(text)
        return element

    # --- forms ------------------------------------------------------------

    def field(self, name, scope=""):
        return self.find(By.XPATH, f"{scope}//*[self::input or self::textarea or self::select][@name={xp(name)}]")

    def field_error(self, name, timeout=3):
        """Text of the validation message under form field `name`, or None.

        shadcn's <FormMessage> has the id "<field id>-message".
        """
        field_id = self.field(name).get_attribute("id")
        try:
            return self.find(By.ID, f"{field_id}-message", timeout=timeout).get_attribute("textContent")
        except TimeoutException:
            return None

    # --- header -----------------------------------------------------------

    USER_MENU_TRIGGER = (By.CSS_SELECTOR, "header [data-slot='dropdown-menu-trigger']")

    def open_user_menu(self):
        self.click(*self.USER_MENU_TRIGGER)
        self.find_visible(By.CSS_SELECTOR, "[role='menu']")

    def sign_out(self):
        self.open_user_menu()
        self.click(By.XPATH, f"//*[@role='menuitem'][normalize-space()={xp(t('auth.signOut'))}]")

    def is_dark(self):
        return "dark" in (self.driver.find_element(By.TAG_NAME, "html").get_attribute("class") or "")

    def toggle_theme(self):
        label = t("layout.switchToLight") if self.is_dark() else t("layout.switchToDark")
        self.click(By.CSS_SELECTOR, f"header button[aria-label='{label}']")

    def switch_language(self, lang_label):
        """lang_label is the button's aria-label: 'Čeština' or 'English'."""
        self.click(By.CSS_SELECTOR, f"header button[aria-label='{lang_label}']")

    def html_lang(self):
        return self.driver.find_element(By.TAG_NAME, "html").get_attribute("lang")
