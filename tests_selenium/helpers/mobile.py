"""Phone emulation and layout checks: is a control on screen, uncovered, and reachable above the keyboard?

Headless Chrome never opens an on-screen keyboard, so KEYBOARD_SHIM fakes one the way iOS
Safari and Android Chrome report it: the layout viewport keeps its full height, and only
`window.visualViewport` shrinks to the part above the keyboard. That visible part can scroll
the page and also pan down over the layout viewport (`visualViewport.offsetTop`), which is how
the bottom of a short page stays reachable while typing. The app listens to exactly these
values (`useVisualViewportVars`), so its own keyboard handling runs.

Focusing a text field opens the fake keyboard and, like a browser, scrolls / pans so the field
is above it. Blurring closes it.
"""

import time

KEYBOARD_HEIGHT = 300

KEYBOARD_SHIM = """
(() => {
  const real = window.visualViewport;
  if (!real || window.__kvKeyboard) return;
  const events = new EventTarget();
  let keyboard = 0;
  let pan = 0;
  const fake = {
    get width() { return real.width; },
    get height() { return window.innerHeight - keyboard; },
    get offsetTop() { return pan; },
    get offsetLeft() { return 0; },
    get pageTop() { return window.scrollY + pan; },
    get pageLeft() { return window.scrollX; },
    get scale() { return 1; },
    addEventListener: (...args) => events.addEventListener(...args),
    removeEventListener: (...args) => events.removeEventListener(...args),
    dispatchEvent: (event) => events.dispatchEvent(event),
  };
  Object.defineProperty(window, "visualViewport", { configurable: true, get: () => fake });

  const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // The part of the layout viewport the user can see, in getBoundingClientRect() coordinates.
  window.__kvVisible = () => ({ top: pan, bottom: pan + window.innerHeight - keyboard, keyboard });

  // Draws the fake keyboard so screenshots and recordings show it. It ignores pointer
  // events, so elementFromPoint (and taps) go straight through it: checks are unaffected.
  const drawn = document.createElement("div");
  drawn.setAttribute("aria-hidden", "true");
  drawn.textContent = "simulated keyboard";
  Object.assign(drawn.style, {
    position: "fixed", left: "0", right: "0", zIndex: "2147483647", pointerEvents: "none",
    display: "none", alignItems: "center", justifyContent: "center", background: "rgba(150,150,160,0.92)",
    color: "#222", font: "600 14px system-ui, sans-serif", letterSpacing: "0.04em",
  });
  const drawKeyboard = () => {
    if (!drawn.isConnected && document.body) document.body.appendChild(drawn);
    drawn.style.display = keyboard ? "flex" : "none";
    drawn.style.height = keyboard + "px";
    drawn.style.top = (pan + window.innerHeight - keyboard) + "px";
  };
  const notify = (type) => {
    events.dispatchEvent(new Event(type));
    drawKeyboard();
  };

  window.__kvKeyboard = (px) => {
    keyboard = px;
    pan = Math.min(pan, keyboard);
    notify("resize");
  };

  // What the user (or the browser, for a focused field) does to see `el`: scroll the page,
  // and when the page cannot scroll further, pan the visible part down over the layout viewport.
  // Scrolling comes first (page and any scrolling container such as a dialog); panning is
  // the last resort, and is undone if it does not help (e.g. a sheet that moves with it).
  const margin = 4;
  const fits = (el) => {
    const r = el.getBoundingClientRect();
    return r.top >= pan - 0.5 && r.bottom <= pan + window.innerHeight - keyboard + 0.5;
  };
  window.__kvReveal = (el) => {
    pan = 0;
    notify("scroll");
    el.scrollIntoView({ block: "center", inline: "nearest" });
    if (fits(el)) return;
    const visibleBottom = window.innerHeight - keyboard;
    let r = el.getBoundingClientRect();
    if (r.bottom > visibleBottom - margin) {
      window.scrollBy(0, r.bottom - visibleBottom + margin);
      if (fits(el)) return;
      r = el.getBoundingClientRect();
    }
    if (keyboard > 0 && r.bottom > visibleBottom) {
      pan = Math.min(keyboard, r.bottom - visibleBottom + margin);
      notify("scroll");
      if (!fits(el)) {
        pan = 0;
        notify("scroll");
        el.scrollIntoView({ block: "center", inline: "nearest" });
      }
    }
  };

  const TEXT_TYPES = ["text", "email", "password", "search", "tel", "url", "number", ""];
  const isTextField = (el) =>
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && TEXT_TYPES.includes(el.type)) ||
    (el instanceof HTMLElement && el.isContentEditable);

  // A real keyboard slides away after the tap that moved focus has landed; closing it at
  // once would shift the page between a tap's press and release.
  let closing = null;
  document.addEventListener("focusin", async (e) => {
    if (!isTextField(e.target)) return;
    clearTimeout(closing);
    window.__kvKeyboard(%(height)d);
    await settle();
    window.__kvReveal(e.target);
    await settle();
    if (!fits(e.target)) window.__kvReveal(e.target);
  }, true);
  document.addEventListener("focusout", (e) => {
    if (!isTextField(e.target)) return;
    clearTimeout(closing);
    closing = setTimeout(() => {
      if (isTextField(document.activeElement)) return;
      pan = 0;
      window.__kvKeyboard(0);
    }, 250);
  }, true);
})();
""" % {"height": KEYBOARD_HEIGHT}


# kvCheck(el, reveal) -> list of problems (empty when the element is fine). Runs in the page.
_CHECK_FN = """
function kvCheck(el, reveal) {
  const visible = window.__kvVisible
    ? window.__kvVisible()
    : { top: 0, bottom: window.innerHeight, keyboard: 0 };
  if (reveal) {
    if (window.__kvReveal) window.__kvReveal(el);
    else el.scrollIntoView({ block: "center", inline: "nearest" });
    Object.assign(visible, window.__kvVisible ? window.__kvVisible() : {});
    // A user scrolls a control out from under a sticky bar (the header, the onboarding
    // question); only when there is no room for that is it a real problem.
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint((r.left + r.right) / 2, Math.max(r.top, visible.top) + 2);
    let bar = hit && !(hit === el || el.contains(hit)) ? hit : null;
    while (bar && bar !== document.body) {
      const position = getComputedStyle(bar).position;
      if (position === "sticky" || position === "fixed") break;
      bar = bar.parentElement;
    }
    if (bar && bar !== document.body && !bar.contains(el)) {
      window.scrollBy(0, -(bar.getBoundingClientRect().bottom - r.top + 4));
    }
  }
  const describe = (node) => {
    if (!node) return "nothing";
    const id = node.id ? "#" + node.id : "";
    const cls = typeof node.className === "string" && node.className
      ? "." + node.className.trim().split(/\\s+/).slice(0, 3).join(".") : "";
    const text = (node.innerText || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return `<${node.tagName.toLowerCase()}${id}${cls}>${text ? ` "${text}"` : ""}`;
  };
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const problems = [];
  const where = `at x=${Math.round(r.left)} y=${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  const screen = `visible area y=${Math.round(visible.top)}..${Math.round(visible.bottom)} of a ${vw}x${window.innerHeight} screen`
    + (visible.keyboard ? `, keyboard ${visible.keyboard}px` : "");
  if (r.width < 1 || r.height < 1) return [`has no size (${where})`];
  if (r.top < visible.top - 0.5 || r.left < -0.5 || r.bottom > visible.bottom + 0.5 || r.right > vw + 0.5) {
    problems.push(`is not fully on screen (${where}, ${screen})`);
  }
  // Sample the middle and four inner points; each must hit the element or something inside it.
  const inset = (a, b) => Math.min(6, (b - a) / 4);
  const xs = [r.left + inset(r.left, r.right), (r.left + r.right) / 2, r.right - inset(r.left, r.right)];
  const ys = [r.top + inset(r.top, r.bottom), (r.top + r.bottom) / 2, r.bottom - inset(r.top, r.bottom)];
  const points = [[xs[1], ys[1]], [xs[0], ys[0]], [xs[2], ys[0]], [xs[0], ys[2]], [xs[2], ys[2]]];
  const coveredBy = new Set();
  for (const [x, y] of points) {
    if (x < 0 || x >= vw || y < visible.top || y >= visible.bottom) continue;
    const top = document.elementFromPoint(x, y);
    // A <label> forwards the tap to its control, so it counts as the control.
    const label = top && top.closest ? top.closest("label") : null;
    if (!top || !(top === el || el.contains(top) || (label && label.contains(el)))) coveredBy.add(describe(top));
  }
  if (coveredBy.size) problems.push(`is covered by ${[...coveredBy].join(", ")} (${where})`);
  return problems;
}
"""

_CHECK_JS = _CHECK_FN + "return kvCheck(arguments[0], arguments[1]);"

_OVERFLOW_JS = """
const overflow = document.documentElement.scrollWidth - window.innerWidth;
if (overflow <= 1) return null;
// Name the elements sticking out so a failure says what to fix.
const wide = [...document.querySelectorAll("body *")]
  .filter((n) => n.getBoundingClientRect().right > window.innerWidth + 1)
  .filter((n) => getComputedStyle(n).position !== "fixed")
  .slice(0, 5)
  .map((n) => `<${n.tagName.toLowerCase()} class="${String(n.className).slice(0, 60)}">`);
return `page is ${overflow}px wider than the ${window.innerWidth}px screen; sticking out: ${wide.join(", ")}`;
"""

# Every control a user might tap, minus ones the app deliberately hides from view.
_CONTROLS_FN = """
function kvControls(scope) {
  const selector = "button, a[href], input:not([type=hidden]), textarea, select, "
    + "[role=checkbox], [role=radio], [role=tab], [role=menuitem]";
  return [...(scope || document.body).querySelectorAll(selector)].filter((el) => {
    if (el.closest("[aria-hidden=true], [inert]")) return false;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // Native inputs Radix keeps behind its own checkbox / radio buttons.
    if (el.matches("input[type=checkbox], input[type=radio]") && style.pointerEvents === "none") return false;
    return true;
  });
}
"""

_SWEEP_JS = _CHECK_FN + _CONTROLS_FN + """
const [scope, skip] = arguments;
const failures = [];
for (const el of kvControls(scope)) {
  if (!el.isConnected) continue;  // re-rendered while we were scrolling
  const label = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("name")
    || el.getAttribute("placeholder") || el.tagName).trim().replace(/\\s+/g, " ").slice(0, 50);
  if (skip.some((s) => label.includes(s))) continue;
  const problems = kvCheck(el, true);
  if (problems.length) failures.push(`'${label}' ${problems.join("; ")}`);
}
window.scrollTo(0, 0);
return failures;
"""


def tap_problems(driver, element, reveal=True):
    return driver.execute_script(_CHECK_JS, element, reveal)


def assert_tappable(driver, element, name=None, reveal=True):
    """Fails unless `element` can be brought fully into the visible area and nothing covers it.

    With `reveal=False` it is checked where it is now (e.g. a field right after it got focus).
    """
    label = name or " ".join((element.text or element.get_attribute("aria-label") or element.tag_name).split())
    problems = tap_problems(driver, element, reveal)
    assert not problems, f"'{label}' " + "; ".join(problems)


def assert_no_horizontal_scroll(driver):
    problem = driver.execute_script(_OVERFLOW_JS)
    assert problem is None, problem


def assert_all_controls_tappable(driver, scope=None, skip=()):
    """Sweeps every visible control (optionally within `scope`) and reports all failures at once.

    Problems are re-checked after a second and only reported if they persist, so an element
    caught mid-animation is not a failure.
    """
    failures = driver.execute_script(_SWEEP_JS, scope, list(skip))
    if failures:
        time.sleep(1)
        again = driver.execute_script(_SWEEP_JS, scope, list(skip))
        persistent = {f.split("' ", 1)[0] for f in failures}
        failures = [f for f in again if f.split("' ", 1)[0] in persistent]
    assert not failures, (
        f"{len(failures)} control(s) not tappable on {driver.current_url}:\n  " + "\n  ".join(failures)
    )


def focus(driver, element):
    """Taps a text field: the fake keyboard opens and the field is scrolled above it."""
    driver.execute_script("arguments[0].focus()", element)
    _settle(driver)


def blur(driver):
    """Dismisses the keyboard and waits for it to slide away."""
    driver.execute_script("document.activeElement && document.activeElement.blur()")
    time.sleep(0.3)
    _settle(driver)


def keyboard_height(driver):
    return driver.execute_script("return window.__kvVisible ? window.__kvVisible().keyboard : 0")


def rect(driver, element):
    return driver.execute_script(
        "const r = arguments[0].getBoundingClientRect();"
        "return {top: r.top, bottom: r.bottom, left: r.left, right: r.right}",
        element,
    )


def visible_area(driver):
    return driver.execute_script("return window.__kvVisible()")


def tap_at(driver, x, y):
    """A one-finger tap at viewport point (x, y) (real touch events, via CDP)."""
    driver.execute_cdp_cmd("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    driver.execute_cdp_cmd("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def tap(driver, element, fx=0.5, fy=0.5):
    """Taps `element` at a fraction of its box (0.5, 0.5 is the centre), after scrolling it into view."""
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'})", element)
    _settle(driver)
    box = rect(driver, element)
    tap_at(driver, box["left"] + (box["right"] - box["left"]) * fx, box["top"] + (box["bottom"] - box["top"]) * fy)


def swipe_down(driver, element, distance, steps=8):
    """A one-finger downward swipe starting near the top of `element` (real touch events, via CDP)."""
    x, y = driver.execute_script(
        "const r = arguments[0].getBoundingClientRect(); return [r.left + r.width / 2, r.top + 10]", element
    )
    driver.execute_cdp_cmd("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    for i in range(1, steps + 1):
        driver.execute_cdp_cmd(
            "Input.dispatchTouchEvent",
            {"type": "touchMove", "touchPoints": [{"x": x, "y": y + distance * i / steps}]},
        )
    driver.execute_cdp_cmd("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def _settle(driver):
    driver.execute_async_script(
        "const done = arguments[arguments.length - 1];"
        "requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 300)));"
    )
