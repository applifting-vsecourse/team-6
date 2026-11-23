from selenium.webdriver.common.by import By

from ..helpers.i18n import t, xp
from .base_page import DIALOG, BasePage, button


class FeedPage(BasePage):
    path = "/kvintet/feed"
    CARDS = (By.XPATH, "//main//li[.//h2]")
    CARD_TITLES = (By.XPATH, "//main//li//h2")

    def wait_loaded(self):
        self.find_visible(By.XPATH, f"//main//h1[normalize-space()={xp(t('kvintet.title'))}]")
        return self

    def card_titles(self):
        return [e.text for e in self.find_all_visible(*self.CARD_TITLES)]

    def card(self, title):
        return self.find_visible(By.XPATH, f"//main//li[.//h2[normalize-space()={xp(title)}]]")

    def join(self, title):
        self.click_element(self.card(title).find_element(*button(t("kvintet.join"), scope=".")))

    # --- filters ----------------------------------------------------------

    def category_filter(self, slug):
        return self.find(By.CSS_SELECTOR, f"main button[role='checkbox'][id$='-{slug}']")

    def toggle_category_filter(self, slug):
        self.click_element(self.category_filter(slug))

    # --- start dialog -----------------------------------------------------

    def open_start_dialog(self):
        self.click(*button(t("kvintet.startOwn.button"), scope="//main"))
        self.find_visible(By.XPATH, DIALOG)
        return StartKvintetDialog(self.driver)


class StartKvintetDialog(BasePage):
    SUBMIT = (By.XPATH, f"{DIALOG}//button[@type='submit']")
    CATEGORY_TOGGLES = (By.XPATH, f"{DIALOG}//button[@data-slot='toggle-group-item']")

    def fill_title(self, title):
        self.type(By.XPATH, f"{DIALOG}//input[@name='title']", title)

    def fill_description(self, text):
        self.type(By.XPATH, f"{DIALOG}//textarea[@name='description']", text)

    def toggle_category(self, label):
        self.click(*button(label, scope=DIALOG))

    def selected_categories(self):
        return [b.text for b in self.find_all_visible(*self.CATEGORY_TOGGLES) if b.get_attribute("aria-pressed") == "true"]

    def submit(self):
        self.click(*self.SUBMIT)

    def cancel(self):
        self.click(*button(t("kvintet.dialog.cancel"), scope=DIALOG))
        self.wait_until_gone(By.XPATH, DIALOG)

    def error(self, field_name):
        return self.field_error(field_name)
