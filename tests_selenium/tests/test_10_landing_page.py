"""The landing page: hero and calls to action (#92, #136), the yellow mascot (#158), the "how it
works" animation (#160) and the product video (#128, #163), on a desktop and on phones.

Animation and video tests ask for reduced motion, so the animation holds its finished scene and
the video waits for a tap instead of starting by itself: nothing depends on timing.
"""

import time

import pytest
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By

from ..conftest import reduce_motion
from ..helpers import mobile
from ..helpers.i18n import t, xp
from ..pages.base_page import BasePage, link, wait_for_js


class TestHero:
    def test_landing_has_hero_and_calls_to_action(self, driver):
        page = BasePage(driver).open("/")
        assert t("landing.heroTitle1") in page.find_visible(By.CSS_SELECTOR, "main h1").text
        assert page.find_all_visible(*link("/signup", scope="//main"))
        assert page.find_all_visible(*link("/login", scope="//main"))

    def test_landing_sign_up_button_opens_registration(self, driver):
        page = BasePage(driver).open("/")
        page.click(*link("/signup", scope="//main"))
        page.wait_for_url(r"/signup")

    def test_signed_in_user_on_landing_is_offered_home(self, user_no_kvintet):
        page = BasePage(user_no_kvintet).open("/")
        page.wait_for_text(t("landing.goToOverview"))


# --- the yellow mascot --------------------------------------------------------------------------

MASCOT = "div.pointer-events-none.fixed.top-0.left-0.z-45"

# Clicks the link and measures, inside the page, how long the mascot stays on screen after.
_CLICK_AND_TIME_MASCOT_JS = """
const [link, selector, done] = arguments;
const start = performance.now();
link.click();
const tick = () => {
  const ms = performance.now() - start;
  if (!document.querySelector(selector)) return done(ms);
  if (ms > 5000) return done(-1);
  setTimeout(tick, 10);
};
tick();
"""

# It used to wait 1500 ms for the next page and then fade for 200 ms. Now it waits 50 ms and
# leaves at once; the rest is slack for the route to load.
MASCOT_LEAVES_WITHIN_MS = 600


class TestMascot:
    """#158: the mascot leaves with the page, unless the next page uses it too."""

    @pytest.mark.parametrize(
        "from_path", ["/", "/signup"], ids=["landing-to-login", "signup-to-login"]
    )
    def test_mascot_is_gone_at_once_on_a_page_without_it(self, driver, from_path):
        page = BasePage(driver).open(from_path)
        page.find_visible(By.CSS_SELECTOR, MASCOT)
        time.sleep(0.5)  # let it land on its anchor
        target = page.find(By.XPATH, "//main//a[@href='/login']")
        ms = driver.execute_async_script(_CLICK_AND_TIME_MASCOT_JS, target, MASCOT)

        page.wait_for_url(r"/login$")
        assert ms >= 0, "the mascot is still on the sign-in page 5 s after leaving"
        assert ms <= MASCOT_LEAVES_WITHIN_MS, f"the mascot lingered {ms:.0f} ms on a page that does not use it"
        time.sleep(1)
        assert not driver.find_elements(By.CSS_SELECTOR, MASCOT), "the mascot came back on the sign-in page"

    def test_mascot_stays_on_a_page_that_uses_it(self, driver):
        """The short wait must still bridge landing -> sign-up, where the mascot is used again."""
        page = BasePage(driver).open("/")
        page.find_visible(By.CSS_SELECTOR, MASCOT)
        page.click(*link("/signup", scope="//main"))
        page.wait_for_url(r"/signup$")
        page.find_visible(By.CSS_SELECTOR, MASCOT)
        time.sleep(1.5)
        assert driver.find_elements(By.CSS_SELECTOR, MASCOT), "the mascot left the sign-up page"


# --- the "how it works" animation ---------------------------------------------------------------

# Every visible tag pair must stay off every other seat's faces and its name.
_TAG_OVERLAPS_JS = """
const R = (e) => e.getBoundingClientRect();
const seats = [...document.querySelectorAll(".ci-stage .ci-seat")];
const hits = [];
seats.forEach((seat, i) => {
  const tags = seat.querySelector(".ci-tags");
  const a = R(tags);
  if (getComputedStyle(tags).opacity === "0" || a.height === 0) return;
  seats.forEach((other, j) => {
    if (i === j) return;
    for (const part of [".ci-faces", ".ci-lab"]) {
      const el = other.querySelector(part);
      if (!el) continue;
      const b = R(el);
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 1 && h > 1) hits.push(`seat ${i + 1}'s tags overlap seat ${j + 1} (${part}) by ${w.toFixed(0)}x${h.toFixed(0)}px`);
    }
  });
});
return hits;
"""

# The layout before #160: the lower pair of seats did not step down while the tags show.
_LAYOUT_BEFORE_FIX_CSS = """
const style = document.createElement("style");
style.textContent = ".ci .ci-stage.ci-tagged .ci-s2, .ci .ci-stage.ci-tagged .ci-s3 { transform: none !important; }";
document.head.appendChild(style);
"""


def _assert_tags_clear(drv):
    reduce_motion(drv)
    page = BasePage(drv).open("/")
    stage = page.find(By.CSS_SELECTOR, ".ci-stage")
    drv.execute_script("arguments[0].scrollIntoView({block: 'center'})", stage)
    wait_for_js(drv, "return document.querySelector('.ci-stage').classList.contains('ci-tagged')",
                "the animation never reached the step with the tags")
    time.sleep(1)  # the lower seats step down over 0.4 s

    hits = drv.execute_script(_TAG_OVERLAPS_JS)
    assert not hits, "tags run into the seats below: " + "; ".join(hits)
    # The check can fail: the same scene laid out as before #160 overlaps.
    drv.execute_script(_LAYOUT_BEFORE_FIX_CSS)
    time.sleep(0.3)
    assert drv.execute_script(_TAG_OVERLAPS_JS), "the overlap check did not catch the layout from before #160"


class TestAnimation:
    def test_tags_stay_clear_of_the_seats_below(self, driver):
        """#160: in the last step the tags under the side seats used to run into the seats below."""
        _assert_tags_clear(driver)


@pytest.mark.mobile
class TestAnimationOnPhone:
    def test_tags_stay_clear_of_the_seats_below(self, phone):
        _assert_tags_clear(phone)


# --- the product video --------------------------------------------------------------------------

PICTURE = "main [role='group'] .aspect-video"
_VIDEO = f"document.querySelector(\"{PICTURE} video\")"
PLAYING = f"const v = {_VIDEO}; return !v.paused && !v.ended && v.currentTime > 0"
PAUSED = f"return {_VIDEO}.paused"
AT_THE_MIDDLE = f"const v = {_VIDEO}; return Math.abs(v.currentTime - v.duration / 2) < v.duration * 0.1"
SEEK = f"main [role='group'] [data-slot='slider'][aria-label={xp(t('videoPlayer.seek'))}]"


def _video(drv):
    reduce_motion(drv)  # no autoplay: the poster waits for a tap
    page = BasePage(drv, timeout=15).open("/")
    picture = page.find(By.CSS_SELECTOR, PICTURE)
    drv.execute_script("arguments[0].scrollIntoView({block: 'center'})", picture)
    wait_for_js(drv, f"return {_VIDEO}.readyState >= 1 && isFinite({_VIDEO}.duration)", "the video did not load", 15)
    assert drv.execute_script(PAUSED), "with reduced motion the video should wait for a tap"
    return page, picture


def _press_picture(drv, picture, fx, fy, touch):
    """A tap (phone) or click (desktop) on the picture at a fraction of its box, away from any button."""
    if touch:
        mobile.tap(drv, picture, fx, fy)
        return
    box = picture.size
    ActionChains(drv).move_to_element_with_offset(
        picture, int(box["width"] * (fx - 0.5)), int(box["height"] * (fy - 0.5))
    ).click().perform()


def _play_and_pause_by_the_picture(drv, touch):
    _, picture = _video(drv)
    # The poster: anywhere on it starts the film with sound, not only the round button.
    _press_picture(drv, picture, 0.2, 0.25, touch)
    wait_for_js(drv, PLAYING, "pressing the poster away from its button did not start the video")
    assert not drv.execute_script(f"return {_VIDEO}.muted"), "a press on the poster should start with sound"

    _press_picture(drv, picture, 0.7, 0.4, touch)
    wait_for_js(drv, PAUSED, "pressing the playing picture did not pause it", 5)
    _press_picture(drv, picture, 0.3, 0.6, touch)
    wait_for_js(drv, PLAYING, "pressing the paused picture did not play it again", 5)


class TestProductVideo:
    """#163 / #128: the picture plays and pauses, the seek bar seeks, the sound badge works."""

    def test_click_the_picture_to_play_and_pause(self, driver):
        _play_and_pause_by_the_picture(driver, touch=False)

    def test_seek_bar_moves_the_video(self, driver):
        page, _ = _video(driver)
        slider = page.find_visible(By.CSS_SELECTOR, SEEK)
        ActionChains(driver).move_to_element(slider).click().perform()
        wait_for_js(driver, AT_THE_MIDDLE, "clicking the middle of the seek bar did not jump to the middle", 5)

    def test_sound_off_badge_turns_the_sound_on(self, driver):
        """Without reduced motion the film starts muted on its own, with a badge to turn sound on."""
        page = BasePage(driver, timeout=15).open("/")
        picture = page.find(By.CSS_SELECTOR, PICTURE)
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", picture)
        wait_for_js(driver, PLAYING, "the video did not start by itself when scrolled into view", 15)
        assert driver.execute_script(f"return {_VIDEO}.muted"), "a video that starts by itself must be muted"
        page.click(By.XPATH, f"//main//*[@role='group']//button[normalize-space()={xp(t('videoPlayer.soundOff'))}]")
        wait_for_js(driver, f"return !{_VIDEO}.muted", "the badge did not turn the sound on", 5)


@pytest.mark.mobile
class TestProductVideoOnPhone:
    def test_tap_the_picture_to_play_and_pause(self, phone):
        _play_and_pause_by_the_picture(phone, touch=True)

    def test_seek_bar_is_shown_and_a_tap_on_it_seeks(self, phone):
        """#128: phones had no seek bar at all, only a hairline showing progress."""
        page, _ = _video(phone)
        slider = page.find(By.CSS_SELECTOR, SEEK)
        assert slider.is_displayed(), "there is no seek bar on a phone"
        mobile.assert_tappable(phone, slider, "the seek bar")
        box = mobile.rect(phone, slider)
        assert box["bottom"] - box["top"] >= 40, "the seek bar is too thin to hit with a finger"

        mobile.tap(phone, slider, 0.5, 0.5)
        wait_for_js(phone, AT_THE_MIDDLE, "tapping the middle of the seek bar did not jump to the middle", 5)

    def test_controls_are_big_enough_for_a_finger(self, phone):
        _, picture = _video(phone)
        controls = picture.find_elements(By.XPATH, "following-sibling::div[1]//button")
        assert controls, "no controls under the video"
        for control in controls:
            name = control.get_attribute("aria-label")
            mobile.assert_tappable(phone, control, name)
            box = mobile.rect(phone, control)
            size = min(box["right"] - box["left"], box["bottom"] - box["top"])
            assert size >= 40, f"'{name}' is only {size:.0f}px, too small for a finger"
        mobile.assert_no_horizontal_scroll(phone)
