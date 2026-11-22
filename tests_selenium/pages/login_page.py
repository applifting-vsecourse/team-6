from selenium.webdriver.common.by import By

from .base_page import BasePage


class LoginPage(BasePage):
    path = "/login"
    SUBMIT = (By.CSS_SELECTOR, "main button[type='submit']")

    def login(self, email, password):
        self.type(By.NAME, "email", email)
        self.type(By.NAME, "password", password)
        self.click(*self.SUBMIT)
