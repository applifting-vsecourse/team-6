import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from .helpers.test_data import FRONTEND_URL, BACKEND_URL, SEEDED_USERS

@pytest.fixture(scope="session")
def chrome_service():
    """Install and provide ChromeDriverManager service once per test session."""
    path = ChromeDriverManager().install()
    return Service(path)

@pytest.fixture
def driver(chrome_service):
    """Provides a fresh headless Chrome browser for each test."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--lang=cs-CZ")

    driver = webdriver.Chrome(service=chrome_service, options=options)
    driver.set_window_size(1280, 800)
    driver.implicitly_wait(3)
    yield driver
    driver.quit()

@pytest.fixture
def mobile_driver(chrome_service):
    """Provides a headless Chrome browser with mobile viewport emulation (375x667)."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=375,667")
    mobile_emulation = {"deviceName": "Nexus 5"}
    options.add_experimental_option("mobileEmulation", mobile_emulation)

    driver = webdriver.Chrome(service=chrome_service, options=options)
    driver.set_window_size(1280, 800)
    driver.implicitly_wait(3)
    yield driver
    driver.quit()

@pytest.fixture
def login_as(driver):
    """Reusable fixture to log in as any user via fast BetterAuth session cookie injection."""
    def _login(user_dict):
        # Open domain first so cookies can be set
        driver.get(FRONTEND_URL)
        
        # Authenticate with BetterAuth
        resp = requests.post(
            f"{BACKEND_URL}/api/auth/sign-in/email",
            json={"email": user_dict["email"], "password": user_dict["password"]},
            headers={"Origin": FRONTEND_URL},
        )
        assert resp.status_code == 200, f"Login failed for {user_dict['email']}: {resp.text}"
        
        # Extract signed session token from Set-Cookie header
        set_cookie = resp.headers.get("set-cookie", "")
        raw_cookie = set_cookie.split(";")[0].split("better-auth.session_token=")[1]

        driver.add_cookie({
            "name": "better-auth.session_token",
            "value": raw_cookie,
            "path": "/",
            "domain": "localhost",
        })
        driver.refresh()
    return _login

@pytest.fixture
def user_no_kvintet(driver, login_as):
    """Fixture providing a driver authenticated as Lenka Malá (onboarded, no kvintet)."""
    login_as(SEEDED_USERS["LENKA_MALA"])
    driver.get(f"{FRONTEND_URL}/overview")
    return driver

@pytest.fixture
def user_proposal_member(driver, login_as):
    """Fixture providing a driver authenticated as Tomáš Dvořák (proposal member who hasn't voted yet)."""
    login_as(SEEDED_USERS["TOMAS_DVORAK"])
    driver.get(f"{FRONTEND_URL}/overview")
    return driver

@pytest.fixture
def user_active_kvintet(driver, login_as):
    """Fixture providing a driver authenticated as Anna Horáková (active kvintet member)."""
    login_as(SEEDED_USERS["ANNA_HORAKOVA"])
    driver.get(f"{FRONTEND_URL}/overview")
    return driver

@pytest.fixture
def user_admin(driver, login_as):
    """Fixture providing a driver authenticated as Superadmin."""
    login_as(SEEDED_USERS["ADMIN"])
    driver.get(f"{FRONTEND_URL}/admin")
    return driver
