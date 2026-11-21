import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from ..helpers.test_data import FRONTEND_URL

class BasePage:
    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(driver, timeout)
        self.base_url = FRONTEND_URL

    def open(self, path=""):
        url = f"{self.base_url}{path}" if path.startswith("/") else path
        self.driver.get(url)
        return self

    def find(self, by, value, timeout=None):
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        return wait.until(EC.presence_of_element_located((by, value)))

    def find_visible(self, by, value, timeout=None):
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        return wait.until(EC.visibility_of_element_located((by, value)))

    def find_all(self, by, value):
        return self.driver.find_elements(by, value)

    def click(self, by, value, timeout=None):
        element = WebDriverWait(self.driver, timeout or self.timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        try:
            element.click()
        except Exception:
            # Fallback to javascript click if obscured or animated
            self.driver.execute_script("arguments[0].click();", element)

    def send_keys(self, by, value, text, clear=True, timeout=None):
        element = self.find_visible(by, value, timeout)
        if clear:
            element.clear()
        element.send_keys(text)

    def get_text(self, by, value, timeout=None):
        return self.find_visible(by, value, timeout).text

    def is_visible(self, by, value, timeout=3):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def wait_for_url(self, pattern, timeout=10):
        WebDriverWait(self.driver, timeout).until(
            EC.url_matches(pattern)
        )

    # Common Header Elements
    def open_user_menu(self):
        user_menu_btn = self.find(By.XPATH, "//header//button[@aria-haspopup='menu' or @data-slot='dropdown-menu-trigger']")
        user_menu_btn.click()
        self.find_visible(By.XPATH, "//*[@role='menu']")

    def sign_out(self):
        self.open_user_menu()
        sign_out_item = self.find(By.XPATH, "//*[@role='menuitem' and contains(., 'Odhlásit se')]")
        sign_out_item.click()
        time.sleep(1)

    def toggle_theme(self):
        theme_btn = self.find(By.XPATH, "//header//button[contains(@aria-label, 'Motiv') or contains(@aria-label, 'theme') or .//*[name()='svg' and (contains(@class, 'lucide-sun') or contains(@class, 'lucide-moon'))]]")
        theme_btn.click()
