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

.venv/bin/pytest tests_selenium/tests/test_04_proposal_voting_and_leaving.py   # one file
.venv/bin/pytest tests_selenium -k "chat"                                     # by name
HEADED=1 .venv/bin/pytest tests_selenium -k "onboarding"                      # watch the browser
.venv/bin/pytest tests_selenium -m mobile                                     # only the phone layout tests
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

## Phone layout tests (`test_10_mobile_layout.py`)

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

The dev server's vite-plugin-checker badge is hidden in every test browser. It is dev tooling,
and it would otherwise cover the bottom-left corner.

| File                                     | Covers                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `test_01_auth_and_registration.py`       | Sign-up validation and consent, duplicate e-mail, sign in/out, route protection                |
| `test_02_onboarding.py`                  | The whole wizard, required answers, tags, Back, unfinished-profile gate (#117)                 |
| `test_03_kvintet_feed_and_creation.py`   | Feed cards, category filter, empty state, join, start a kvintet                                |
| `test_04_proposal_voting_and_leaving.py` | Voting rules, last vote starts the kvintet, vote reset on join, leaving                        |
| `test_05_active_kvintet_and_chat.py`     | 'Kvintet begins', names revealed, chat send/receive/poll, whitespace, HTML escaping, access    |
| `test_06_profile_and_account.py`         | Profile answers and radius (#119), Edit round trip (#152), account deletion (#65)              |
| `test_07_admin_dashboard.py`             | Pilot overview, numbers match the API, admin-only access (#112)                                |
| `test_08_public_pages_and_responsive.py` | Landing, info pages, 404, theme, language, phone menu                                          |
| `test_09_closed_pr_regressions.py`       | #154, #118, #124, #111/#151, #147, #148, #116                                                  |
| `test_10_mobile_layout.py`               | Phone layout: every screen, menus, bottom sheets and swipe (#113), keyboard (#115), chat, tour |
