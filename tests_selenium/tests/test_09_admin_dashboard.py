"""Admin account and pilot overview (#112), its layout (#162) and the admin's phone menu (#159)."""

import time

import pytest
from selenium.webdriver.common.by import By

from ..helpers import mobile
from ..helpers.api_client import ApiClient
from ..helpers.i18n import t, xp
from ..helpers.test_data import FRONTEND_URL, SEEDED_USERS
from ..pages.admin_page import AdminPage
from ..pages.base_page import DIALOG, wait_for_js


def _admin_api():
    api = ApiClient()
    api.sign_in(SEEDED_USERS["ADMIN"]["email"], SEEDED_USERS["ADMIN"]["password"])
    return api


class TestAdminDashboard:
    def test_admin_sees_pilot_overview(self, user_admin):
        page = AdminPage(user_admin).open().wait_loaded()
        for key in (
            "admin.users.title",
            "admin.users.registered",
            "admin.users.onboarded",
            "admin.users.activeToday",
            "admin.kvintets.title",
            "admin.kvintets.total",
            "admin.kvintets.active",
        ):
            page.wait_for_text(t(key))

    def test_numbers_match_the_stats_api(self, user_admin):
        stats = _admin_api().session.get(_admin_api()._url("/admin/stats")).json()
        page = AdminPage(user_admin).open().wait_loaded()
        main = page.find_visible("tag name", "main").text
        assert str(stats["users"]["registered"]) in main
        assert str(stats["kvintets"]["total"]) in main

    def test_new_registration_is_counted(self, scenario):
        admin = _admin_api()
        before = admin.session.get(admin._url("/admin/stats")).json()["users"]["registered"]
        scenario.user("py-admin-count")
        after = admin.session.get(admin._url("/admin/stats")).json()["users"]["registered"]
        assert after == before + 1

    def test_admin_link_is_in_the_admin_header_only(self, user_admin):
        AdminPage(user_admin).open().wait_loaded()
        assert user_admin.find_elements("css selector", "header a[href='/admin']")


class TestAdminAccess:
    def test_regular_user_gets_not_found(self, user_no_kvintet):
        user_no_kvintet.get(f"{FRONTEND_URL}/admin")
        page = AdminPage(user_no_kvintet)
        page.wait_for_text(t("errors.pageNotFound"))
        assert not page.has_text(t("admin.title"), timeout=1)
        assert not user_no_kvintet.find_elements("css selector", "header a[href='/admin']")

    @pytest.mark.parametrize("who, status", [("anonymous", 401), ("member", 403)])
    def test_stats_api_is_admin_only(self, who, status):
        api = ApiClient()
        if who == "member":
            api.sign_in(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])
        assert api.session.get(api._url("/admin/stats")).status_code == status


# --- layout of the numbers (#162) ---------------------------------------------------------------

_STAT_ROWS_JS = """
return [...document.querySelectorAll("main dl > div")].map((row) => {
  const dt = row.querySelector("dt"), dd = row.querySelector("dd");
  if (!dt || !dd) return null;
  const a = dt.getBoundingClientRect(), b = dd.getBoundingClientRect();
  const share = dd.querySelector("span");
  const section = row.closest("section");
  return {
    group: section ? (section.querySelector("h2, h3") || {}).textContent : "",
    label: dt.textContent.trim(),
    value: dd.textContent.trim(),
    dtRight: a.right, ddLeft: b.left, ddRight: b.right,
    dtOverflow: dt.scrollWidth - dt.clientWidth,
    font: parseFloat(getComputedStyle(dd).fontSize),
    shareBelow: share ? share.getBoundingClientRect().top - b.top : null,
    viewport: document.documentElement.clientWidth,
  };
}).filter(Boolean);
"""

HEADLINES = (t("admin.users.registered"), t("admin.kvintets.total"))


def _stat_rows(drv):
    AdminPage(drv).open().wait_loaded()
    wait_for_js(
        drv,
        "const dds = [...document.querySelectorAll('main dl dd')];"
        "return dds.length > 0 && dds.every((d) => d.textContent.trim() !== '')",
        "the admin numbers did not load",
        15,
    )
    time.sleep(0.5)
    return drv.execute_script(_STAT_ROWS_JS)


def _assert_totals_are_headlines(rows):
    for headline in HEADLINES:
        head = next((r for r in rows if r["label"] == headline), None)
        assert head, f"'{headline}' is missing from the admin overview"
        details = [r for r in rows if r["group"] == head["group"] and r["label"] != headline]
        assert details, f"no detail rows under '{headline}'"
        for row in details:
            assert head["font"] > row["font"], (
                f"'{headline}' ({head['font']}px) should be larger than '{row['label']}' ({row['font']}px)"
            )


def _assert_rows_read_cleanly(rows):
    for row in rows:
        label = f"'{row['label']}' = '{row['value']}'"
        assert row["dtRight"] <= row["ddLeft"] + 0.5, f"{label}: the label runs into the number"
        assert row["ddRight"] <= row["viewport"] + 0.5, f"{label}: the number runs off the screen"
        assert row["dtOverflow"] <= 1, f"{label}: the label is cut off instead of wrapping"
        if row["shareBelow"] is not None:
            assert row["shareBelow"] >= 8, f"{label}: the share should sit under the number, not beside it"


class TestAdminDashboardLayout:
    """#162: each group's total is set apart, and labels, numbers and shares never collide."""

    def test_totals_are_set_apart_and_rows_read_cleanly(self, user_admin):
        rows = _stat_rows(user_admin)
        _assert_totals_are_headlines(rows)
        _assert_rows_read_cleanly(rows)


@pytest.mark.mobile
class TestAdminOnPhone:
    @pytest.fixture
    def admin_phone(self, phone, phone_login):
        phone_login(SEEDED_USERS["ADMIN"])  # read-only: these tests only look
        return phone

    def test_overview_fits_and_reads_cleanly(self, admin_phone):
        """#162 on a phone: long labels wrap beside the number, shares go under it."""
        rows = _stat_rows(admin_phone)
        mobile.assert_no_horizontal_scroll(admin_phone)
        _assert_totals_are_headlines(rows)
        _assert_rows_read_cleanly(rows)
        mobile.assert_all_controls_tappable(admin_phone)

    def test_menu_fits_on_one_screen_without_scrolling(self, admin_phone):
        """#159: with the extra Admin row the menu used to need scrolling on a phone."""
        page = AdminPage(admin_phone).open().wait_loaded()
        page.click(By.CSS_SELECTOR, f"header button[aria-label={xp(t('layout.openMenu'))}]")
        sheet = page.find_visible(By.XPATH, DIALOG)
        time.sleep(0.6)  # the sheet slides in
        assert sheet.find_elements(By.XPATH, ".//a[@href='/admin']"), "the Admin row is missing from the menu"
        body = sheet.find_element(By.XPATH, ".//div[contains(@class, 'overflow-y-auto')]")
        hidden = admin_phone.execute_script("return arguments[0].scrollHeight - arguments[0].clientHeight", body)
        assert hidden <= 1, f"the admin menu needs scrolling: {hidden}px do not fit on the screen"
        mobile.assert_all_controls_tappable(admin_phone, scope=sheet)

        page.click(By.XPATH, f"{DIALOG}//a[@href='/overview']")
        page.wait_for_url(r"/overview")
        page.wait_until_gone(By.XPATH, DIALOG)
