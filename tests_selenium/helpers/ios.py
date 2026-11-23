"""Real mobile Safari on the iOS Simulator, driven through Appium (XCUITest driver).

Here the on-screen keyboard is Apple's own: the simulator runs with the hardware keyboard
disconnected, and taps are native (`nativeWebTap`), so tapping a field focuses it the way a
finger does and the keyboard slides up. "Visible above the keyboard" is measured with Safari's
real `window.visualViewport`.

Setup (once): Xcode with an iOS Simulator runtime, then `pnpm test:ios:setup`. See README.
"""

import base64
import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request

APPIUM_DIR = os.path.expanduser(os.environ.get("APPIUM_DIR", "~/.appium-kvintet"))
APPIUM_HOME = os.path.join(APPIUM_DIR, "home")
APPIUM_BIN = os.path.join(APPIUM_DIR, "node_modules", ".bin", "appium")
APPIUM_PORT = int(os.environ.get("APPIUM_PORT", "4723"))
APPIUM_URL = f"http://127.0.0.1:{APPIUM_PORT}"

from .test_data import FRONTEND_URL

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts", "ios")

# Defines window.__kvVisible from Safari's real visual viewport, so helpers/mobile.py's checks
# measure against the real keyboard. Measured on iOS 26 Safari: getBoundingClientRect() is
# relative to the visible area, so the visible area is y = 0 .. visualViewport.height in those
# coordinates. Also hides the dev server's error badge, which is dev-only tooling.
# Re-run after every navigation.
REAL_VIEWPORT_JS = """
window.__kvVisible = () => {
  const vv = window.visualViewport;
  return { top: 0, bottom: vv.height, keyboard: 0 };
};
// What a user does to see a control while typing: scroll it to the middle of the part above
// the keyboard.
window.__kvReveal = (el) => {
  el.scrollIntoView({ block: "center", inline: "nearest" });
  const r = el.getBoundingClientRect();
  window.scrollBy(0, (r.top + r.bottom) / 2 - window.visualViewport.height / 2);
};
if (!document.getElementById("kv-hide-dev-badge")) {
  const style = document.createElement("style");
  style.id = "kv-hide-dev-badge";
  style.textContent = "vite-plugin-checker-error-overlay { display: none !important; }";
  document.head.appendChild(style);
}
"""

_WEB_FIELDS_JS = """
return [...document.querySelectorAll("input, textarea")]
  .filter((e) => e.type !== "hidden")
  .map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })
  .filter((r) => r[2] > 0 && r[3] > 0);
"""

_NATIVE_FIELD_CLASSES = ("XCUIElementTypeTextField", "XCUIElementTypeSecureTextField", "XCUIElementTypeTextView")


def _in_native(driver, fn):
    web_context = driver.current_context
    driver.switch_to.context("NATIVE_APP")
    try:
        return fn()
    finally:
        driver.switch_to.context(web_context)


def page_offset_on_screen(driver):
    """Where Safari draws the page: (dx, dy) to add to getBoundingClientRect() to get screen points.

    Safari's chrome (status bar, tab bar) moves the page around, so this is calibrated by
    matching the page's form fields with the text fields iOS exposes to accessibility.
    """
    from collections import Counter

    from appium.webdriver.common.appiumby import AppiumBy

    web = driver.execute_script(_WEB_FIELDS_JS)
    native = _in_native(
        driver,
        lambda: [e.rect for cls in _NATIVE_FIELD_CLASSES for e in driver.find_elements(AppiumBy.CLASS_NAME, cls)],
    )
    offsets = Counter()
    for x, y, w, h in web:
        for n in native:
            if abs(n["width"] - w) <= 1 and abs(n["height"] - h) <= 1:
                offsets[(round(n["x"] - x), round(n["y"] - y))] += 1
    if not offsets:
        raise AssertionError("could not locate the page on screen (no matching text fields)")
    return offsets.most_common(1)[0][0]


# iOS system prompts that sit on top of Safari and swallow taps (iOS offers to save the
# password after every sign-in / registration). The first choice also stops it for localhost.
_SYSTEM_PROMPT_BUTTONS = ("Pro tuto stránku nikdy", "Never for This Website", "Teď ne", "Not Now")


def dismiss_system_prompts(driver):
    """Closes an iOS system sheet such as 'Save password?' if one is showing. Returns True if it did."""
    from appium.webdriver.common.appiumby import AppiumBy

    def _dismiss():
        for label in _SYSTEM_PROMPT_BUTTONS:
            buttons = [b for b in driver.find_elements(AppiumBy.ACCESSIBILITY_ID, label) if b.is_displayed()]
            if buttons:
                buttons[0].click()
                time.sleep(0.8)
                return True
        return False

    return _in_native(driver, _dismiss)


def tap(driver, element, attempts=3):
    """A real finger tap on a text field at its true position on the simulator screen.

    Waits for the keyboard; on a slow simulator a tap can land while the page is still settling,
    so it recalibrates and taps again (as a person would), up to `attempts` times.
    """
    for _ in range(attempts):
        dismiss_system_prompts(driver)
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", element)
        time.sleep(0.6)
        dx, dy = page_offset_on_screen(driver)
        left, top, width, height = driver.execute_script(
            "const r = arguments[0].getBoundingClientRect(); return [r.left, r.top, r.width, r.height]", element
        )
        x, y = dx + left + width / 2, dy + top + min(height / 2, 20)
        _in_native(driver, lambda: driver.execute_script("mobile: tap", {"x": x, "y": y}))
        deadline = time.time() + 4
        while time.time() < deadline:
            if keyboard_shown(driver):
                return
            time.sleep(0.25)


def appium_installed():
    return os.path.exists(APPIUM_BIN)


def _port_open(port):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def start_appium_server(log_path):
    """Starts Appium unless one is already listening. Returns the process we started, or None."""
    if _port_open(APPIUM_PORT):
        return None
    log = open(log_path, "w")
    proc = subprocess.Popen(
        [APPIUM_BIN, "--port", str(APPIUM_PORT), "--log-level", "info", "--relaxed-security"],
        env={**os.environ, "APPIUM_HOME": APPIUM_HOME},
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{APPIUM_URL}/status", timeout=2) as resp:
                if json.load(resp)["value"]["ready"]:
                    return proc
        except Exception:
            time.sleep(0.5)
    proc.terminate()
    raise RuntimeError(f"Appium did not start; see {log_path}")


def pick_simulator():
    """The iPhone simulator to use: $IOS_DEVICE, else the newest available plain iPhone."""
    wanted = os.environ.get("IOS_DEVICE")
    out = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "available", "--json"],
        capture_output=True, text=True, check=True, timeout=120,
    ).stdout
    devices = []
    for runtime, entries in json.loads(out)["devices"].items():
        if "iOS" not in runtime:
            continue
        version = runtime.rsplit("iOS-", 1)[-1].replace("-", ".")
        for d in entries:
            if d["name"].startswith("iPhone"):
                devices.append((version, d["name"], d["udid"]))
    if not devices:
        raise RuntimeError("No iPhone simulator available. Install an iOS runtime in Xcode > Settings > Components.")
    if wanted:
        matches = [d for d in devices if d[1] == wanted]
        if not matches:
            raise RuntimeError(f"No simulator named {wanted!r}; available: {sorted({d[1] for d in devices})}")
        return max(matches)
    plain = [d for d in devices if d[1].split()[-1].isdigit()] or devices  # "iPhone 17", not "Pro Max"
    return max(plain, key=lambda d: (tuple(int(p) for p in d[0].split(".")), d[1]))


def safari_options(version, device_name, udid):
    from appium.options.ios import XCUITestOptions

    options = XCUITestOptions()
    options.platform_name = "iOS"
    options.browser_name = "Safari"
    options.automation_name = "XCUITest"
    options.platform_version = version
    options.device_name = device_name
    options.udid = udid
    options.set_capability("appium:connectHardwareKeyboard", False)  # the software keyboard shows
    options.set_capability("appium:forceSimulatorSoftwareKeyboardPresence", True)
    # Fields are tapped with real touches via tap() below; Appium's own nativeWebTap misplaces
    # them under iOS 26 Safari's bars. Plain clicks (buttons) go through WebDriver.
    options.set_capability("appium:nativeWebTap", False)
    options.set_capability("appium:safariIgnoreFraudWarning", True)
    # Start on the app itself: recent iOS does not always expose about:blank to the Web
    # Inspector, and a cold Safari on a busy machine takes a while to show up there.
    options.set_capability("appium:safariInitialUrl", FRONTEND_URL)
    options.set_capability("appium:webviewConnectTimeout", 60000)
    options.set_capability("appium:newCommandTimeout", 300)
    options.set_capability("appium:simulatorStartupTimeout", 300000)
    options.set_capability("appium:wdaLaunchTimeout", 300000)
    return options


def keyboard_shown(driver):
    """Asks iOS itself whether the software keyboard is on screen."""
    return bool(driver.is_keyboard_shown())


def wait_for_keyboard(driver, shown=True, timeout=8):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if keyboard_shown(driver) == shown:
            time.sleep(0.6)  # let the slide animation and Safari's own scrolling finish
            return
        time.sleep(0.25)
    raise AssertionError(f"the iOS keyboard did not {'appear' if shown else 'go away'} within {timeout}s")


def install_viewport_probe(driver):
    driver.execute_script(REAL_VIEWPORT_JS)


class Recorder:
    """Records the simulator screen for one test and saves screenshots of key moments."""

    def __init__(self, driver, name):
        self.driver = driver
        self.name = name
        self.dir = os.path.abspath(ARTIFACTS_DIR)
        os.makedirs(self.dir, exist_ok=True)
        self.shots = 0
        self.recording = False

    def start(self):
        if not shutil.which("ffmpeg"):
            return  # Appium needs ffmpeg for video; screenshots still work
        try:
            self.driver.start_recording_screen(videoType="libx264", videoQuality="medium", timeLimit="300")
            self.recording = True
        except Exception:
            self.recording = False

    def shot(self, label):
        self.shots += 1
        path = os.path.join(self.dir, f"{self.name}-{self.shots:02d}-{label}.png")
        self.driver.get_screenshot_as_file(path)
        return path

    def stop(self):
        if not self.recording:
            return None
        data = self.driver.stop_recording_screen()
        path = os.path.join(self.dir, f"{self.name}.mp4")
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        return path
