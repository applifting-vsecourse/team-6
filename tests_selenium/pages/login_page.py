from selenium.webdriver.common.by import By
from .base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[name='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_ALERT = (By.CSS_SELECTOR, "[role='alert'], .text-destructive")
    SIGN_UP_LINK = (By.CSS_SELECTOR, "a[href='/signup']")

    def open(self):
        return super().open("/login")

    def login(self, email: str, password: str):
        self.send_keys(*self.EMAIL_INPUT, email)
        self.send_keys(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BUTTON)

    def get_error_message(self):
        return self.get_text(*self.ERROR_ALERT)
