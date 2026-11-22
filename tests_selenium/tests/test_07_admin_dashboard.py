"""Admin account and pilot overview (#112)."""

import pytest

from ..helpers.api_client import ApiClient
from ..helpers.i18n import t
from ..helpers.test_data import FRONTEND_URL, SEEDED_USERS
from ..pages.admin_page import AdminPage


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
