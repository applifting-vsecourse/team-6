"""Registration (#34, #89), sign in / sign out (#36, #90) and route protection."""

from ..helpers.api_client import ApiClient
from ..helpers.i18n import t
from ..helpers.test_data import FRONTEND_URL, SEEDED_USERS, generate_random_user
from ..pages.login_page import LoginPage
from ..pages.signup_page import SignUpPage


def _delete(user):
    api = ApiClient()
    try:
        api.sign_in(user["email"], user["password"])
        api.delete_account()
    except Exception:
        pass


class TestRegistration:
    def test_sign_up_happy_path_leads_to_onboarding(self, driver):
        user = generate_random_user("reg-ok")
        page = SignUpPage(driver).open()
        try:
            page.register(user)
            page.wait_for_url(r"/onboarding")
        finally:
            _delete(user)

    def test_empty_form_shows_every_required_message(self, driver):
        page = SignUpPage(driver).open()
        page.submit()

        assert page.field_error("name") == t("auth.validation.nameRequired")
        assert page.field_error("username") == t("auth.validation.usernameRequired")
        assert page.field_error("email") == t("auth.validation.emailRequired")
        assert page.field_error("password") == t("auth.validation.passwordMin", count=8)
        assert page.field_error("passwordConfirmation") == t("auth.validation.passwordConfirmationRequired")
        assert page.has_text(t("auth.validation.codeOfConductRequired"))
        assert "/signup" in driver.current_url

    def test_mismatched_passwords_are_rejected(self, driver):
        user = generate_random_user("reg-mismatch")
        page = SignUpPage(driver).open()
        page.register(user, confirm_password=user["password"] + "x")

        assert page.field_error("passwordConfirmation") == t("auth.validation.passwordsMatch")
        assert "/signup" in driver.current_url

    def test_short_password_is_rejected(self, driver):
        user = dict(generate_random_user("reg-short"), password="short1")
        page = SignUpPage(driver).open()
        page.register(user)

        assert page.field_error("password") == t("auth.validation.passwordMin", count=8)

    def test_code_of_conduct_consent_is_required(self, driver):
        """#34: no account without accepting the community rules."""
        user = generate_random_user("reg-noconsent")
        page = SignUpPage(driver).open()
        page.register(user, accept_consent=False)

        page.wait_for_text(t("auth.validation.codeOfConductRequired"))
        assert "/signup" in driver.current_url
        # And nothing was created on the server.
        resp = ApiClient().session.post(
            f"{ApiClient().backend_url}/api/auth/sign-in/email",
            json={"email": user["email"], "password": user["password"]},
        )
        assert resp.status_code == 401

    def test_backend_rejects_sign_up_without_consent(self):
        """#34: the API enforces the consent too, not just the form."""
        user = generate_random_user("reg-api-noconsent")
        resp = ApiClient().sign_up(user["email"], user["password"], user["name"], user["username"], accept_coc=False)
        assert resp.status_code >= 400
        assert resp.json().get("code") == "CODE_OF_CONDUCT_REQUIRED"

    def test_duplicate_email_shows_server_error(self, driver):
        user = dict(generate_random_user("reg-dup"), email=SEEDED_USERS["JAN_NOVAK"]["email"])
        page = SignUpPage(driver).open()
        page.register(user)

        page.wait_for_text(t("errors.auth.USER_ALREADY_EXISTS"))
        assert "/signup" in driver.current_url

    def test_code_of_conduct_link_points_to_rules(self, driver):
        page = SignUpPage(driver).open()
        link = page.find_visible(*SignUpPage.CODE_OF_CONDUCT_LINK)
        assert link.get_attribute("href").endswith("/code-of-conduct")


class TestSignInAndOut:
    def test_onboarded_user_signs_in_to_overview(self, driver):
        page = LoginPage(driver).open()
        page.login(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])
        page.wait_for_url(r"/overview")

    def test_user_without_profile_signs_in_to_onboarding_or_home_prompt(self, driver, scenario):
        """#36: someone who has not finished onboarding is sent on to finish it."""
        user = generate_random_user("login-noprofile")
        api = ApiClient()
        assert api.sign_up(user["email"], user["password"], user["name"], user["username"]).status_code == 200
        scenario.clients.append(api)

        page = LoginPage(driver).open()
        page.login(user["email"], user["password"])
        page.wait_for_url(r"/(onboarding|overview)")
        if "/overview" in driver.current_url:
            page.wait_for_text(t("overview.profileNotFinished.title"))

    def test_wrong_password_shows_generic_error(self, driver):
        page = LoginPage(driver).open()
        page.login(SEEDED_USERS["JAN_NOVAK"]["email"], "definitely-wrong-password")

        page.wait_for_text(t("errors.auth.INVALID_EMAIL_OR_PASSWORD"))
        assert "/login" in driver.current_url

    def test_unknown_email_shows_the_same_error(self, driver):
        """No account enumeration: unknown e-mail and wrong password read the same."""
        page = LoginPage(driver).open()
        page.login("nobody-here-123456@example.com", "whatever-password")

        page.wait_for_text(t("errors.auth.INVALID_EMAIL_OR_PASSWORD"))
        assert "/login" in driver.current_url

    def test_protected_routes_redirect_anonymous_users_to_login(self, driver):
        page = LoginPage(driver)
        for path in ("/overview", "/profile", "/kvintet/feed", "/kvintet/messages", "/onboarding", "/admin"):
            driver.get(f"{FRONTEND_URL}{path}")
            page.wait_for_url(r"/login")

    def test_sign_out_ends_the_session(self, driver):
        page = LoginPage(driver).open()
        page.login(SEEDED_USERS["LENKA_MALA"]["email"], SEEDED_USERS["LENKA_MALA"]["password"])
        page.wait_for_url(r"/overview")

        page.sign_out()
        page.wait_for_url(r"^http://localhost:3050/?($|\?|login)")

        driver.get(f"{FRONTEND_URL}/overview")
        page.wait_for_url(r"/login")
