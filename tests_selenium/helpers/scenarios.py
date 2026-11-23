"""Builds self-contained kvintet scenarios through the API.

Tests that change state (voting, leaving, chatting, deleting) must not touch the
seeded demo users: one run would change what the next run sees. These builders
create fresh, onboarded users instead, and the `scenario` fixture deletes them
again after the test.
"""

from .api_client import create_onboarded_user
from .test_data import generate_random_proposal

KVINTET_CAPACITY = 5


class Scenario:
    def __init__(self):
        self.clients = []

    def user(self, prefix="py-user"):
        """A fresh onboarded user with no kvintet. Returns (user_dict, api_client)."""
        user, api = create_onboarded_user(prefix)
        self.clients.append(api)
        return user, api

    def forming_kvintet(self, members=1, prefix="py-forming"):
        """A FORMING kvintet with `members` fresh users (1–4).

        Returns (kvintet_id, proposal, [(user, api), ...]); the first user is the founder.
        """
        assert 1 <= members < KVINTET_CAPACITY, "a fifth member activates the kvintet"
        proposal = generate_random_proposal(prefix)
        people = [self.user(prefix) for _ in range(members)]
        kvintet_id = people[0][1].create_kvintet(
            proposal["title"], proposal["description"], proposal["category_slugs"]
        )["id"]
        for _, api in people[1:]:
            api.join_kvintet(kvintet_id)
        return kvintet_id, proposal, people

    def active_kvintet(self, prefix="py-active"):
        """An ACTIVE kvintet: five fresh users, the fifth join activates it."""
        kvintet_id, proposal, people = self.forming_kvintet(KVINTET_CAPACITY - 1, prefix)
        fifth = self.user(prefix)
        fifth[1].join_kvintet(kvintet_id)
        people.append(fifth)
        return kvintet_id, proposal, people

    def cleanup(self):
        for api in self.clients:
            try:
                api.delete_account()
            except Exception:
                pass  # already deleted by the test, or the backend is gone
