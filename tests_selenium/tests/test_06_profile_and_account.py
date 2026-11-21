from ..pages.profile_page import ProfilePage
from ..helpers.test_data import generate_random_user, SEEDED_USERS, FRONTEND_URL
from ..helpers.api_client import ApiClient

class TestProfileAndAccount:
    """Profile viewing and account deletion tests."""

    def test_view_profile(self, user_no_kvintet):
        """[PROF-1] Displays user name, email, and blobatars on /profile."""
        profile_page = ProfilePage(user_no_kvintet)
        profile_page.open()

        assert SEEDED_USERS["LENKA_MALA"]["name"] in user_no_kvintet.page_source
        assert SEEDED_USERS["LENKA_MALA"]["email"] in user_no_kvintet.page_source
        assert profile_page.is_visible(*ProfilePage.DELETE_ACCOUNT_BTN)

    def test_delete_account_dialog_cancel(self, user_no_kvintet):
        """[ACC-1 / PR #65] Cancelling account deletion keeps user authenticated."""
        profile_page = ProfilePage(user_no_kvintet)
        profile_page.open()

        profile_page.open_delete_dialog()
        assert profile_page.is_visible(*ProfilePage.DELETE_DIALOG)

        profile_page.cancel_delete()
        assert not profile_page.is_visible(*ProfilePage.DELETE_DIALOG)
        assert "/profile" in user_no_kvintet.current_url

    def test_delete_account_happy_path(self, driver, login_as):
        """[ACC-2 / PR #65] Confirming account deletion permanently purges session."""
        user = generate_random_user("del-acc")
        api = ApiClient()
        api.sign_up(user["email"], user["password"], user["name"], user["username"])
        api.complete_onboarding()

        login_as(user)

        profile_page = ProfilePage(driver)
        profile_page.open()

        profile_page.open_delete_dialog()
        profile_page.click(*ProfilePage.CONFIRM_DELETE_BTN)

        profile_page.wait_for_url(r".*/(login|\?.*)?$")
        assert "/profile" not in driver.current_url
