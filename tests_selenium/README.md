# Selenium end-to-end tests

Browser tests (Python, pytest, Selenium, headless Chrome) that click through the running app:
registration, onboarding, the feed, voting, leaving, chat, profile, account deletion, the admin
overview, public pages, and regressions pinned to merged pull requests.

## Run

The app must be running (`pnpm dev`) with the sign-in rate limit off. The suite signs in
far more often than the 10-per-minute limit allows:

```shell
# apps/backend/.env (the backend reloads by itself)
DISABLE_RATE_LIMIT=true
```

Then:

```shell
pnpm test:selenium:setup   # once: creates .venv and installs requirements.txt
pnpm test:selenium         # the whole suite, about 10 minutes

.venv/bin/pytest tests_selenium/tests/test_05_proposal_voting_and_leaving.py   # one file
.venv/bin/pytest tests_selenium -k "chat"                                     # by name
HEADED=1 .venv/bin/pytest tests_selenium -k "onboarding"                      # watch the browser
.venv/bin/pytest tests_selenium -m mobile                                     # only the phone tests (any file)
.venv/bin/pytest tests_selenium -m "not mobile"                               # everything else
```

You need Google Chrome. Selenium Manager downloads a matching chromedriver by itself.
When a test fails, a screenshot of its browser is saved to `tests_selenium/artifacts/` (ignored by git).

Before the tests start, a preflight check stops the run with a hint if the app is not up, the
rate limit is still on, or the seeded demo users are no longer in their seeded state
(fix that with `pnpm backend seed`).

## How the suite is built

- **Test data never leaks between runs.** Tests that change state (start, join, vote, leave,
  chat, delete) do it with fresh users the `scenario` fixture creates through the API
  (`helpers/scenarios.py`), and it deletes them after the test. Seeded demo users are only
  read (`user_no_kvintet`, `user_active_kvintet`, `user_admin`); never change them in a test.
- **Sign-in is a fixture.** `login_as(user_or_api_client)` signs in through the API and puts the
  BetterAuth session cookie in the browser, so only `test_01` goes through the login form.
  `fresh_user` gives a new onboarded user who is already signed in.
- **Text comes from the translation files.** Selectors that match visible text use
  `t("group.key")` from `helpers/i18n.py`, which reads `apps/frontend/src/i18n/locales/cs.json`.
  A copy change does not break the suite; a renamed key fails loudly with `Missing translation key`.
  Elsewhere, selectors use stable attributes: `name`, `href`, `role`, `aria-*`, `data-slot`.
- **Page objects** in `pages/` hold the selectors; tests read as user steps.

## Phone layout tests (`test_12_phone_layout.py`)

Each one runs on every phone in `conftest.PHONES` (320x568 and 390x844) with touch emulation.
They check that controls are **tappable**: after scrolling a control into view the way a user
would (including out from under the sticky header), it is fully inside the visible area and
`elementFromPoint` at its middle and corners hits the control itself, not the header, the
mascot, a sheet or anything else. Sweeps check every control on a screen at once and also
fail on horizontal scrolling.

**The keyboard is simulated.** Headless Chrome has no on-screen keyboard, so
`helpers/mobile.py` fakes one the way iOS Safari and Android Chrome report it: focusing a text
field shrinks `window.visualViewport` by 300px (the layout viewport stays full height), and the
visible part can scroll and pan like on a phone. The app's own keyboard handling
(`useVisualViewportVars`, which lifts bottom sheets above the keyboard) reacts to it, so the
tests check the real behaviour: sheets ride above the keyboard, and submit buttons can be
reached while typing. It is a model of a phone, not a phone. Check new keyboard-heavy screens
on a real device once.

`TestTheLayoutChecksCatchProblems` breaks a page on purpose (a covering element, a button under
the keyboard, an overly wide element) to prove the checks can fail.

## Real iOS Safari (`test_13_ios_keyboard.py`, opt-in)

Five keyboard tests also run in real Safari on the iOS Simulator, with Apple's own keyboard:
sign-in, sign-up, the start-kvintet sheet (#115), chat and the onboarding note. They are
skipped unless you ask for them, because the simulator is heavy (about 2–3 GB of RAM):

```shell
sudo xcodebuild -runFirstLaunch   # once per Xcode install, needs your password
pnpm test:ios:setup               # once: Appium 3.9 + XCUITest driver into ~/.appium-kvintet
pnpm test:ios                     # boots an iPhone simulator; first run also builds WebDriverAgent
```

Needs Xcode with an iOS Simulator runtime. `IOS_DEVICE="iPhone 17 Pro"` picks another simulator.
Every test records the simulator screen and saves screenshots to `tests_selenium/artifacts/ios/`.
Shut the simulator down afterwards with `xcrun simctl shutdown all`.

What is special about real Safari, all handled in `helpers/ios.py`:

- Fields are tapped with real touches at their true screen position. Safari draws the page
  below the status bar, so the offset is calibrated against the text fields iOS reports.
- iOS's "Save password?" sheet appears after a sign-in and blocks taps; the tests answer
  "Never for this website".
- In a sign-up password field (`new-password`), the simulator shows no keyboard, because iOS
  wants to offer a Keychain password instead. The sign-up test fills those without the keyboard;
  the sign-in test covers typing a password with the keyboard up.
- iOS blanks the keyboard in screenshots while a password field has focus. That is iOS privacy,
  not a test problem.

The dev server's vite-plugin-checker badge is hidden in every test browser. It is dev tooling,
and it would otherwise cover the bottom-left corner.

| File                                       | Covers                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `test_01_auth_and_registration.py`         | Sign-up validation and consent, duplicate e-mail, sign in/out, route protection                                        |
| `test_02_onboarding.py`                    | The whole wizard, required answers, tags, Back, map pin (#116), unfinished-profile gate (#117)                         |
| `test_03_home.py`                          | Home's heading in every state, no date above it (#161); members on a phone (#148)                                      |
| `test_04_kvintet_feed_and_creation.py`     | Feed cards, category filter, empty state, join, start a kvintet, description length (#154), 1-3 categories (#118)      |
| `test_05_proposal_voting_and_leaving.py`   | Voting rules, last vote starts the kvintet, vote reset on join, leaving, last member leaving (#124)                    |
| `test_06_active_kvintet_and_chat.py`       | 'Kvintet begins', names revealed, chat send/receive/poll, whitespace, HTML escaping, access                            |
| `test_07_product_tour.py`                  | First-visit tour (#111), replay from the user menu (#151) and the phone menu (#147)                                    |
| `test_08_profile_and_account.py`           | Profile answers and radius (#119), Edit round trip (#152), account deletion (#65)                                      |
| `test_09_admin_dashboard.py`               | Pilot overview, numbers match the API, admin-only access (#112), layout of the numbers (#162), admin phone menu (#159) |
| `test_10_landing_page.py`                  | Hero and calls to action, mascot leaves with the page (#158), animation tags (#160), product video (#128/#163)         |
| `test_11_info_pages_theme_and_language.py` | Info pages, 404, theme, language, the public phone menu                                                                |
| `test_12_phone_layout.py`                  | Phone layout: every screen, menus, bottom sheets and swipe (#113), keyboard (#115), chat, tour                         |
| `test_13_ios_keyboard.py`                  | Opt-in: the real iOS keyboard in Safari on the iOS Simulator (sign-in, sign-up, start sheet, chat, note)               |
