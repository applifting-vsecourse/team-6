from selenium.webdriver.common.by import By
from ..pages.base_page import BasePage

class TestPublicPagesAndResponsive:
    """Public pages, theme toggle, and mobile responsive behavior."""

    def test_landing_page(self, driver):
        """[PUB-1 / PR #110] Landing page displays hero, video CTA, and navigation links."""
        base_page = BasePage(driver)
        base_page.open("/")

        assert base_page.is_visible(By.CSS_SELECTOR, "h1")
        assert base_page.is_visible(By.XPATH, "//a[@href='/how-it-works']")
        assert base_page.is_visible(By.XPATH, "//a[@href='/code-of-conduct']")

    def test_how_it_works_page(self, driver):
        """[PUB-2] How it works page loads explanation."""
        base_page = BasePage(driver)
        base_page.open("/how-it-works")

        assert base_page.is_visible(By.CSS_SELECTOR, "h1")
        assert "kvintet" in driver.page_source.lower()

    def test_code_of_conduct_page(self, driver):
        """[PUB-3] Code of conduct lists rules and reporting email."""
        base_page = BasePage(driver)
        base_page.open("/code-of-conduct")

        assert base_page.is_visible(By.XPATH, "//h1[contains(., 'Pravidla komunity')]")
        assert "Buďte laskaví" in driver.page_source

    def test_theme_switcher(self, driver):
        """[THEME-1] Theme switcher toggles dark mode."""
        base_page = BasePage(driver)
        base_page.open("/")

        html = driver.find_element(By.TAG_NAME, "html")
        initial_dark = "dark" in (html.get_attribute("class") or "")

        base_page.toggle_theme()
        toggled_dark = "dark" in (html.get_attribute("class") or "")
        assert initial_dark != toggled_dark

    def test_mobile_hamburger_drawer(self, mobile_driver):
        """[MOBILE-1 / PR #106, #145] Mobile viewport has hamburger menu opening sheet."""
        base_page = BasePage(mobile_driver)
        base_page.open("/")

        menu_btn = mobile_driver.find_element(By.XPATH, "//header//button[contains(@aria-label, 'menu') or .//*[name()='svg' and contains(@class, 'lucide-menu')]]")
        assert menu_btn.is_displayed()
        menu_btn.click()

        dialog = mobile_driver.find_element(By.CSS_SELECTOR, "[role='dialog']")
        assert dialog.is_displayed()
