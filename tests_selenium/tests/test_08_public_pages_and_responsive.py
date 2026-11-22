"""Landing and info pages (#92, #110, #136), theme (#55), language (#31), phone layout (#88, #113)."""

from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from ..pages.base_page import DIALOG, BasePage, link


class TestPublicPages:
    def test_landing_has_hero_and_calls_to_action(self, driver):
        page = BasePage(driver).open("/")
        assert t("landing.heroTitle1") in page.find_visible(By.CSS_SELECTOR, "main h1").text
        assert page.find_all_visible(*link("/signup", scope="//main"))
        assert page.find_all_visible(*link("/login", scope="//main"))

    def test_landing_sign_up_button_opens_registration(self, driver):
        page = BasePage(driver).open("/")
        page.click(*link("/signup", scope="//main"))
        page.wait_for_url(r"/signup")

    def test_how_it_works_page(self, driver):
        page = BasePage(driver).open("/")
        page.click(*link("/how-it-works", scope="//footer"))
        page.wait_for_url(r"/how-it-works")
        page.wait_for_text(t("howItWorks.step1Title"))

    def test_code_of_conduct_page(self, driver):
        page = BasePage(driver).open("/code-of-conduct")
        page.find_visible(By.XPATH, f"//main//h1[normalize-space()={xp(t('codeOfConduct.title'))}]")
        page.wait_for_text(t("codeOfConduct.rule2"))

    def test_unknown_route_shows_not_found(self, driver):
        page = BasePage(driver).open("/this-page-does-not-exist")
        page.wait_for_text(t("errors.pageNotFound"))

    def test_signed_in_user_on_landing_is_offered_home(self, user_no_kvintet):
        page = BasePage(user_no_kvintet).open("/")
        page.wait_for_text(t("landing.goToOverview"))


class TestThemeAndLanguage:
    def test_theme_toggle_switches_and_persists(self, driver):
        """The starting theme follows the OS colour scheme; the toggle flips it and is remembered."""
        page = BasePage(driver).open("/")
        page.find_visible(By.CSS_SELECTOR, "main h1")
        started_dark = page.is_dark()

        page.toggle_theme()
        assert page.is_dark() is not started_dark
        driver.refresh()
        page.find_visible(By.CSS_SELECTOR, "main h1")
        assert page.is_dark() is not started_dark

        page.toggle_theme()
        assert page.is_dark() is started_dark

    def test_language_switch_to_english_and_back(self, driver):
        page = BasePage(driver).open("/")
        assert page.html_lang() == "cs"

        page.switch_language("English")
        page.wait_for_text(t("landing.heroTitle1", lang="en"))
        assert page.html_lang() == "en"
        driver.refresh()
        page.wait_for_text(t("landing.heroTitle1", lang="en"))

        page.switch_language("Čeština")
        page.wait_for_text(t("landing.heroTitle1", lang="cs"))
        assert page.html_lang() == "cs"


class TestPhoneLayout:
    def test_hamburger_menu_opens_navigation_sheet(self, mobile_driver):
        page = BasePage(mobile_driver).open("/")
        page.click(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")

        sheet = page.find_visible(By.XPATH, DIALOG)
        for href in ("/signup", "/login", "/how-it-works", "/code-of-conduct"):
            assert sheet.find_elements(*link(href, scope="."))

        page.click(*link("/how-it-works", scope=DIALOG))
        page.wait_for_url(r"/how-it-works")
        page.wait_until_gone(By.XPATH, DIALOG)

    def test_theme_can_be_switched_from_the_phone_menu(self, mobile_driver):
        page = BasePage(mobile_driver).open("/")
        page.click(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")
        target = "common.themeLight" if page.is_dark() else "common.themeDark"
        page.click(By.XPATH, f"{DIALOG}//button[@role='radio'][normalize-space()={xp(t(target))}]")
        assert page.is_dark() is (target == "common.themeDark")

    def test_desktop_nav_is_replaced_by_the_menu_button(self, mobile_driver):
        page = BasePage(mobile_driver).open("/")
        page.find_visible(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")
        assert not page.find_all_visible(By.CSS_SELECTOR, "header button[aria-label='English']")
