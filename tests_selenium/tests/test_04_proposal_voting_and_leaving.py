"""Forming kvintet: voting to start (#50) and leaving (#97, #124).

Every test builds its own kvintet from fresh users; the seeded ones are never changed.
"""

from ..helpers.i18n import t
from ..pages.overview_page import OverviewPage


def _signed_in_overview(driver, login_as, api):
    login_as(api)
    return OverviewPage(driver).open()


class TestVoting:
    def test_with_two_members_there_is_nothing_to_vote_on_yet(self, driver, login_as, scenario):
        _, _, people = scenario.forming_kvintet(2)
        overview = _signed_in_overview(driver, login_as, people[0][1])

        overview.wait_for_heading(t("overview.forming.heading"))
        overview.wait_for_text(t("overview.forming.waitingTitle"))
        assert not overview.can_vote(timeout=1)

    def test_member_votes_to_start(self, driver, login_as, scenario):
        _, _, people = scenario.forming_kvintet(3)
        api = people[0][1]
        overview = _signed_in_overview(driver, login_as, api)

        overview.wait_for_text(t("overview.forming.canVoteTitle"))
        overview.vote()

        overview.wait_for_text(t("kvintet.vote.voted"))
        assert not overview.can_vote(timeout=1)
        status = api.get_my_kvintet().json()["voteStatus"]
        assert status["userHasVoted"] is True and status["votedCount"] == 1
        overview.wait_for_text(
            t("overview.forming.seatsStatus", seats=3, capacity=5, voted=1, total=3)
        )

    def test_last_vote_starts_the_kvintet(self, driver, login_as, scenario):
        """When everyone has agreed, the kvintet starts and the member sees 'Kvintet begins'."""
        kvintet_id, proposal, people = scenario.forming_kvintet(3)
        for _, other in people[1:]:
            other.vote()

        overview = _signed_in_overview(driver, login_as, people[0][1])
        overview.vote()

        overview.wait_for_url(r"/kvintet/begins")
        overview.wait_for_text(t("kvintet.begins.title.three"))
        assert people[0][1].get_my_kvintet().json()["status"] == "ACTIVE"

    def test_names_stay_hidden_until_the_kvintet_starts(self, driver, login_as, scenario):
        _, _, people = scenario.forming_kvintet(3)
        overview = _signed_in_overview(driver, login_as, people[0][1])

        overview.wait_for_text(t("overview.forming.whoSubtitle"))
        text = overview.main_text()
        assert people[1][0]["name"] not in text
        assert people[2][0]["name"] not in text

    def test_someone_joining_resets_the_votes(self, driver, login_as, scenario):
        kvintet_id, _, people = scenario.forming_kvintet(3)
        people[0][1].vote()
        newcomer, newcomer_api = scenario.user("py-newcomer")
        newcomer_api.join_kvintet(kvintet_id)

        overview = _signed_in_overview(driver, login_as, people[0][1])
        overview.wait_for_text(t("overview.forming.canVoteTitle"))
        assert overview.can_vote()
        assert people[0][1].get_my_kvintet().json()["voteStatus"]["votedCount"] == 0


class TestLeaving:
    def test_cancel_keeps_the_membership(self, driver, login_as, scenario):
        _, _, people = scenario.forming_kvintet(2)
        overview = _signed_in_overview(driver, login_as, people[0][1])

        overview.wait_for_heading(t("overview.forming.heading"))
        overview.open_leave_dialog()
        overview.cancel_leave()

        overview.wait_for_heading(t("overview.forming.heading"))
        assert people[0][1].get_my_kvintet().status_code == 200

    def test_confirm_leaves_and_offers_other_kvintets(self, driver, login_as, scenario):
        _, proposal, people = scenario.forming_kvintet(2)
        api = people[0][1]
        overview = _signed_in_overview(driver, login_as, api)

        overview.wait_for_heading(t("overview.forming.heading"))
        overview.open_leave_dialog()
        overview.confirm_leave()

        overview.wait_for_text(t("overview.noKvintet.leftNotice", title=proposal["title"]))
        assert api.get_my_kvintet().status_code != 200
        # The other member is still there.
        assert len(people[1][1].get_my_kvintet().json()["members"]) == 1

    def test_leave_dialog_explains_votes_reset(self, driver, login_as, scenario):
        _, _, people = scenario.forming_kvintet(2)
        overview = _signed_in_overview(driver, login_as, people[0][1])

        dialog = overview.open_leave_dialog()
        assert t("kvintet.dialog.leaveTitle") in dialog.text
        assert t("kvintet.dialog.leaveLastMemberDescription") not in dialog.text
        overview.cancel_leave()
