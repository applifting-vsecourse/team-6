import requests

from .test_data import BACKEND_URL, FRONTEND_URL

SESSION_COOKIE = "better-auth.session_token"


class ApiClient:
    """Talks to the backend API directly, for fast test setup and teardown.

    A requests.Session keeps the BetterAuth session cookie between calls, so
    sign up / sign in once and every following call is authenticated.
    """

    def __init__(self, backend_url=BACKEND_URL, frontend_url=FRONTEND_URL):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.session = requests.Session()
        # BetterAuth rejects requests without a trusted Origin.
        self.session.headers.update({"Origin": frontend_url})

    def _url(self, path):
        return f"{self.backend_url}/api{path}"

    @property
    def session_token(self):
        return self.session.cookies.get(SESSION_COOKIE)

    # --- auth -------------------------------------------------------------

    def sign_in(self, email, password):
        resp = self.session.post(
            self._url("/auth/sign-in/email"),
            json={"email": email, "password": password},
        )
        resp.raise_for_status()
        return resp.json()

    def sign_up(self, email, password, name, username, accept_coc=True):
        return self.session.post(
            self._url("/auth/sign-up/email"),
            json={
                "email": email,
                "password": password,
                "name": name,
                "username": username,
                "acceptCodeOfConduct": accept_coc,
            },
        )

    # --- profile ----------------------------------------------------------

    def get_profile(self):
        resp = self.session.get(self._url("/me/profile"))
        resp.raise_for_status()
        return resp.json()

    def complete_onboarding(self, roles=None, frequency="WEEKLY"):
        resp = self.session.put(
            self._url("/me/profile"),
            json={
                "roles": roles or ["software-engineer"],
                "weekdays": True,
                "evenings": True,
                "cityId": "city_praha",
                "radiusKm": 25,
                "meetingFrequency": frequency,
                "completeOnboarding": True,
            },
        )
        resp.raise_for_status()
        return resp.json()

    def mark_tour_completed(self):
        resp = self.session.post(self._url("/me/profile/tour-completed"))
        resp.raise_for_status()

    def delete_account(self):
        return self.session.delete(self._url("/me"))

    # --- kvintets ---------------------------------------------------------

    def create_kvintet(self, title, description, category_slugs=None):
        resp = self.session.post(
            self._url("/kvintets"),
            json={
                "title": title,
                "description": description,
                "categorySlugs": category_slugs or ["leisure"],
            },
        )
        resp.raise_for_status()
        return resp.json()

    def join_kvintet(self, kvintet_id):
        resp = self.session.post(self._url(f"/kvintets/{kvintet_id}/members"))
        resp.raise_for_status()

    def get_my_kvintet(self):
        return self.session.get(self._url("/kvintets/mine"))

    def vote(self):
        resp = self.session.post(self._url("/kvintets/mine/vote"))
        resp.raise_for_status()
        return resp.json()

    def leave_kvintet(self):
        return self.session.delete(self._url("/kvintets/mine/membership"))

    def send_message(self, body):
        return self.session.post(self._url("/kvintets/mine/messages"), json={"body": body})


def create_onboarded_user(prefix="py-user", tour_done=True):
    """Registers a fresh user through the API and completes onboarding.

    Returns (user_dict, api_client) — the client stays signed in as that user.
    """
    from .test_data import generate_random_user

    user = generate_random_user(prefix)
    api = ApiClient()
    resp = api.sign_up(user["email"], user["password"], user["name"], user["username"])
    assert resp.status_code == 200, f"Sign-up failed: {resp.status_code} {resp.text}"
    api.complete_onboarding()
    if tour_done:
        api.mark_tour_completed()
    return user, api
