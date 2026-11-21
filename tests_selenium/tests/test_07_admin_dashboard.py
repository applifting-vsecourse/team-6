from ..pages.admin_page import AdminPage
from ..helpers.test_data import FRONTEND_URL

class TestAdminDashboard:
    """Admin pilot metrics and authorization."""

    def test_admin_access_restricted_for_regular_user(self, user_no_kvintet):
        """[ADMIN-1] Non-admin cannot access admin panel."""
        user_no_kvintet.get(f"{FRONTEND_URL}/admin")

        # Must not remain on /admin
        AdminPage(user_no_kvintet).wait_for_url(r".*/(login|overview).*")
        assert "/admin" not in user_no_kvintet.current_url

    def test_admin_dashboard_metrics(self, user_admin):
        """[ADMIN-2 / PR #112] Superadmin sees pilot metrics cards."""
        admin_page = AdminPage(user_admin)
        admin_page.open()

        assert admin_page.is_visible(*AdminPage.HEADING)
        assert admin_page.is_visible(*AdminPage.REGISTERED_CARD)
        assert admin_page.is_visible(*AdminPage.ONBOARDED_CARD)
        assert admin_page.is_visible(*AdminPage.ACTIVE_CARD)
        assert admin_page.is_visible(*AdminPage.KVINTETS_CARD)
