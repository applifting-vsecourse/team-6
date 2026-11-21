import requests
from .test_data import BACKEND_URL, FRONTEND_URL

class ApiClient:
    """Helper for interacting with the backend API directly (for fast setup/teardown)."""

    def __init__(self, backend_url=BACKEND_URL, frontend_url=FRONTEND_URL):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.session = requests.Session()

    def sign_in(self, email: str, password: str):
        url = f"{self.backend_url}/api/auth/sign-in/email"
        resp = self.session.post(
            url,
            json={"email": email, "password": password},
            headers={"Origin": self.frontend_url},
        )
        resp.raise_for_status()
        return resp.json()

    def sign_up(self, email: str, password: str, name: str, username: str, accept_coc: bool = True):
        url = f"{self.backend_url}/api/auth/sign-up/email"
        resp = self.session.post(
            url,
            json={
                "email": email,
                "password": password,
                "name": name,
                "username": username,
                "acceptCodeOfConduct": accept_coc,
            },
            headers={"Origin": self.frontend_url},
        )
        return resp

    def complete_onboarding(self, roles=None, frequency="WEEKLY"):
        url = f"{self.backend_url}/api/profile"
        payload = {
            "roles": roles or ["developer"],
            "weekdays": True,
            "evenings": True,
            "meetingFrequency": frequency,
            "onboardingCompleted": True,
        }
        resp = self.session.put(
            url,
            json=payload,
            headers={"Origin": self.frontend_url},
        )
        resp.raise_for_status()
        return resp.json()

    def create_kvintet(self, title: str, description: str, category_slugs=None):
        url = f"{self.backend_url}/api/kvintet"
        payload = {
            "title": title,
            "description": description,
            "categorySlugs": category_slugs or ["leisure"],
        }
        resp = self.session.post(
            url,
            json=payload,
            headers={"Origin": self.frontend_url},
        )
        resp.raise_for_status()
        return resp.json()
