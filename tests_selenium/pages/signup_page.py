from selenium.webdriver.common.by import By
from .base_page import BasePage

class SignUpPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[name='email']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name']")
    USERNAME_INPUT = (By.CSS_SELECTOR, "input[name='username']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='password']")
    CONFIRM_PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='passwordConfirmation']")
    CONSENT_CHECKBOX = (By.CSS_SELECTOR, "button[role='checkbox'], input[type='checkbox']")
    CODE_OF_CONDUCT_LINK = (By.XPATH, "//a[@href='/code-of-conduct' or contains(., 'pravidly komunity')]")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    BLOBATAR_PREVIEW = (By.CSS_SELECTOR, "svg[data-blobatar], .blobatar, svg[data-seed]")
    
    EMAIL_ERROR = (By.XPATH, "//*[contains(@class, 'text-destructive') and (contains(., 'e-mail') or contains(., 'E-mail') or contains(., 'Účet s tímto e-mailem'))]")
    PASSWORD_ERROR = (By.XPATH, "//*[contains(@class, 'text-destructive') and (contains(., 'heslo') or contains(., 'Heslo') or contains(., 'znaků'))]")
    CONFIRM_PASSWORD_ERROR = (By.XPATH, "//*[contains(@class, 'text-destructive') and (contains(., 'shodovat') or contains(., 'potvrďte'))]")
    CONSENT_ERROR = (By.XPATH, "//*[contains(@class, 'text-destructive') and (contains(., 'pravidly') or contains(., 'souhlaste'))]")

    def open(self):
        return super().open("/signup")

    def register(self, email=None, name=None, username=None, password=None, confirm_password=None, accept_consent=True):
        if email:
            self.send_keys(*self.EMAIL_INPUT, email)
        if name:
            self.send_keys(*self.NAME_INPUT, name)
        if username:
            self.send_keys(*self.USERNAME_INPUT, username)
        if password:
            self.send_keys(*self.PASSWORD_INPUT, password)
        if confirm_password:
            self.send_keys(*self.CONFIRM_PASSWORD_INPUT, confirm_password)

        if accept_consent:
            checkbox = self.find(*self.CONSENT_CHECKBOX)
            is_checked = checkbox.get_attribute("aria-checked") == "true" or checkbox.is_selected()
            if not is_checked:
                self.click(*self.CONSENT_CHECKBOX)

        self.click(*self.SUBMIT_BUTTON)
