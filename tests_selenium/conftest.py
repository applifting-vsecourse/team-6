import contextlib
import os
import re

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from .helpers.api_client import SESSION_COOKIE, ApiClient
from .helpers import recording
from .helpers.mobile import KEYBOARD_SHIM
from .helpers.scenarios import Scenario
from .helpers.test_data import FRONTEND_URL, SEEDED_USERS

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
HEADLESS = os.environ.get("HEADED") != "1"


PHONE_USER_AGENT = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
)

# The dev server's vite-plugin-checker badge floats over the bottom-left corner. It is dev-only
# tooling, not part of the app, so it must not intercept taps or count as covering a control.
HIDE_DEV_TOOLING = """
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = "vite-plugin-checker-error-overlay { display: none !important; }";
  document.head.appendChild(style);
});
"""

# The phone sizes the layout suite runs on: a small, short phone and a common modern one.
PHONES = {"small-320x568": (320, 568), "common-390x844": (390, 844)}


def _chrome(width, height, mobile=False):
    options = Options()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument("--lang=cs-CZ")
    options.add_experimental_option("prefs", {"intl.accept_languages": "cs,cs-CZ"})
    if mobile:
        options.add_experimental_option(
            "mobileEmulation",
            {
                "deviceMetrics": {"width": width, "height": height, "pixelRatio": 2.0, "touch": True, "mobile": True},
                "userAgent": PHONE_USER_AGENT,
            },
        )
    # Selenium Manager (built into selenium >= 4.6) resolves a matching chromedriver.
    driver = webdriver.Chrome(options=options)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": HIDE_DEV_TOOLING})
    if mobile:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": KEYBOARD_SHIM})
    else:
        driver.set_window_size(width, height)
    return driver


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Saves a screenshot of every browser a failed test used, into tests_selenium/artifacts/."""
    outcome = yield
    report = outcome.get_result()
    if report.when != "call" or not report.failed:
        return
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    name = re.sub(r"[^\w.-]", "_", item.nodeid.split("::", 1)[-1])
    for fixture_name in ("driver", "mobile_driver", "phone", "ios_safari"):
        drv = item.funcargs.get(fixture_name)
        if drv is not None:
            try:
                drv.save_screenshot(os.path.join(ARTIFACTS_DIR, f"{name}-{fixture_name}.png"))
            except Exception:
                pass


@pytest.fixture(scope="session", autouse=True)
def preflight():
    """Fails fast, with a hint, when the app or its data is not what the suite expects."""
    import requests

    from .helpers.test_data import BACKEND_URL

    try:
        requests.get(f"{BACKEND_URL}/api/health", timeout=5).raise_for_status()
        requests.get(FRONTEND_URL, timeout=5).raise_for_status()
    except Exception as exc:
        pytest.exit(f"Kvintet is not running on {FRONTEND_URL} / {BACKEND_URL} ({exc}). Start it with `pnpm dev`.", 2)

    # The sign-in rate limit (10/min) must be off, or most tests fail with 429.
    for _ in range(12):
        resp = requests.post(
            f"{BACKEND_URL}/api/auth/sign-in/email",
            json={"email": "nobody@example.com", "password": "x" * 8},
            headers={"Origin": FRONTEND_URL},
        )
        if resp.status_code == 429:
            pytest.exit(
                "The BetterAuth rate limit is on. Set DISABLE_RATE_LIMIT=true in apps/backend/.env "
                "and let the backend reload.",
                2,
            )

    # Read-only fixtures rely on these seeded users being in their seeded state.
    expected = {"LENKA_MALA": None, "ANNA_HORAKOVA": "ACTIVE"}
    for key, status in expected.items():
        api = ApiClient()
        try:
            api.sign_in(SEEDED_USERS[key]["email"], SEEDED_USERS[key]["password"])
        except Exception:
            pytest.exit(f"Seeded user {key} cannot sign in. Run `pnpm backend seed`.", 2)
        resp = api.get_my_kvintet()
        actual = resp.json()["status"] if resp.ok else None
        if actual != status:
            pytest.exit(
                f"Seeded user {key} should have kvintet status {status}, has {actual}. "
                "The demo data has drifted; run `pnpm backend seed` to reset it.",
                2,
            )


@contextlib.contextmanager
def _recorded(drv, request, label):
    """With RECORD=1, records what this browser renders to artifacts/videos/<test>-<label>.mp4."""
    cast = None
    if recording.enabled():
        name = re.sub(r"[^\w.-]", "_", request.node.name) + f"-{label}"
        try:
            cast = recording.Screencast(drv, name)
        except Exception as exc:  # never fail a test because recording could not start
            print(f"recording unavailable: {exc}")
    try:
        yield
    finally:
        if cast:
            cast.stop()


@pytest.fixture
def driver(request):
    """A fresh desktop Chrome (1280x900) per test."""
    drv = _chrome(1280, 900)
    with _recorded(drv, request, "desktop"):
        yield drv
    drv.quit()


@pytest.fixture
def mobile_driver(request):
    """A fresh Chrome emulating a 375x667 touch phone (with the fake on-screen keyboard)."""
    drv = _chrome(375, 667, mobile=True)
    with _recorded(drv, request, "phone"):
        yield drv
    drv.quit()


def reduce_motion(drv):
    """Makes the browser ask for reduced motion (prefers-reduced-motion: reduce) from now on.

    The landing animation then holds its finished scene, and the product video does not start
    by itself, so what a test sees does not depend on timing.
    """
    drv.execute_cdp_cmd(
        "Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]}
    )
    return drv


@pytest.fixture(params=list(PHONES), ids=list(PHONES))
def phone(request):
    """A touch phone; every test using it runs once per size in PHONES."""
    drv = _chrome(*PHONES[request.param], mobile=True)
    with _recorded(drv, request, "phone"):
        yield drv
    drv.quit()


@pytest.fixture
def phone_login(phone):
    """Signs the phone in with a signed-in ApiClient (or a user dict)."""

    def _login(user_or_api):
        api = user_or_api
        if not isinstance(api, ApiClient):
            api = ApiClient()
            api.sign_in(user_or_api["email"], user_or_api["password"])
        inject_session(phone, api)
        return api

    return _login


@pytest.fixture
def scenario():
    """Creates fresh users / kvintets through the API and deletes the users after the test."""
    s = Scenario()
    yield s
    s.cleanup()


def inject_session(drv, api):
    """Signs the browser in with the BetterAuth session of an already signed-in ApiClient."""
    drv.get(FRONTEND_URL)
    drv.add_cookie(
        {"name": SESSION_COOKIE, "value": api.session_token, "path": "/", "domain": "localhost"}
    )


@pytest.fixture
def login_as(driver):
    """Logs the desktop browser in, skipping the login form (that is covered by test_01).

    Accepts either a user dict with email/password, or a signed-in ApiClient.
    Leaves the browser on the frontend root; navigate where the test needs.
    """

    def _login(user_or_api):
        if isinstance(user_or_api, ApiClient):
            api = user_or_api
        else:
            api = ApiClient()
            api.sign_in(user_or_api["email"], user_or_api["password"])
        inject_session(driver, api)
        return api

    return _login


def _seeded(driver, login_as, key, path):
    login_as(SEEDED_USERS[key])
    driver.get(f"{FRONTEND_URL}{path}")
    return driver


# Read-only fixtures for seeded demo users. Never change these users' state in a test.


@pytest.fixture
def user_no_kvintet(driver, login_as):
    """Lenka Malá: onboarded, in no kvintet."""
    return _seeded(driver, login_as, "LENKA_MALA", "/overview")


@pytest.fixture
def user_active_kvintet(driver, login_as):
    """Anna Horáková: member of the active kvintet 'Frontend craft circle'."""
    return _seeded(driver, login_as, "ANNA_HORAKOVA", "/overview")


@pytest.fixture
def user_admin(driver, login_as):
    """Superadmin."""
    return _seeded(driver, login_as, "ADMIN", "/admin")


@pytest.fixture
def fresh_user(driver, login_as, scenario):
    """A brand-new onboarded user with no kvintet, signed in. Returns (user, api)."""
    user, api = scenario.user("py-fresh")
    login_as(api)
    return user, api


# --- real iOS Safari (Appium + iOS Simulator), opt-in with --ios ----------------------------


def pytest_addoption(parser):
    parser.addoption(
        "--ios",
        action="store_true",
        help="also run the tests marked 'ios' on real Safari in the iOS Simulator (needs Xcode + Appium)",
    )


def pytest_collection_modifyitems(config, items):
    if config.getoption("--ios"):
        return
    skip = pytest.mark.skip(reason="real iOS Safari tests run with --ios (pnpm test:ios)")
    for item in items:
        if "ios" in item.keywords:
            item.add_marker(skip)


@pytest.fixture(scope="session")
def ios_session():
    """One Safari session on the iOS Simulator for the whole run (booting it is slow)."""
    from .helpers import ios

    if not ios.appium_installed():
        pytest.skip("Appium is not installed; run `pnpm test:ios:setup`")
    os.makedirs(ios.ARTIFACTS_DIR, exist_ok=True)
    server = ios.start_appium_server(os.path.join(ios.ARTIFACTS_DIR, "appium.log"))
    version, name, udid = ios.pick_simulator()

    from appium import webdriver as appium_webdriver

    drv = appium_webdriver.Remote(ios.APPIUM_URL, options=ios.safari_options(version, name, udid))
    drv.implicitly_wait(0)
    drv.ios_device = f"{name} (iOS {version})"
    yield drv
    try:
        drv.quit()
    finally:
        if server:
            server.terminate()


@pytest.fixture
def ios_safari(ios_session, request):
    """Safari on the iOS Simulator, signed out, with this test recorded to artifacts/ios/<test>.mp4."""
    from .helpers.ios import Recorder

    drv = ios_session
    drv.get(FRONTEND_URL)
    drv.delete_all_cookies()
    drv.execute_script("try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}")
    name = re.sub(r"[^\w.-]", "_", request.node.name)
    recorder = Recorder(drv, name)
    recorder.start()
    drv.recorder = recorder
    yield drv
    recorder.stop()
