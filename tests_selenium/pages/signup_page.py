from selenium.webdriver.common.by import By

from .base_page import BasePage


class SignUpPage(BasePage):
    path = "/signup"
    CONSENT = (By.CSS_SELECTOR, "main button[role='checkbox']")
    CODE_OF_CONDUCT_LINK = (By.CSS_SELECTOR, "main a[href='/code-of-conduct']")
    SUBMIT = (By.CSS_SELECTOR, "main button[type='submit']")

    def fill(self, user, confirm_password=None, accept_consent=True):
        self.type(By.NAME, "name", user["name"])
        self.type(By.NAME, "username", user["username"])
        self.type(By.NAME, "email", user["email"])
        self.type(By.NAME, "password", user["password"])
        self.type(By.NAME, "passwordConfirmation", confirm_password or user["password"])
        if accept_consent != self.consent_checked():
            self.click(*self.CONSENT)

    def consent_checked(self):
        return self.find(*self.CONSENT).get_attribute("aria-checked") == "true"

    def submit(self):
        self.click(*self.SUBMIT)

    def register(self, user, **kwargs):
        self.fill(user, **kwargs)
        self.submit()
