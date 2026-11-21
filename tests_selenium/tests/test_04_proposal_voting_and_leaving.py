from selenium.webdriver.common.by import By
from ..pages.overview_page import OverviewPage
from ..helpers.test_data import generate_random_user
from ..helpers.api_client import ApiClient

class TestProposalVotingAndLeaving:
    """Voting and leaving proposal interactions."""

    def test_proposal_voting(self, user_proposal_member):
        """[KVI-2 / PR #15] Proposal member sees vote button and can toggle vote."""
        overview_page = OverviewPage(user_proposal_member)
        overview_page.open()

        assert overview_page.is_visible(*OverviewPage.FORMING_HEADING)
        assert overview_page.is_visible(*OverviewPage.VOTE_BUTTON)

        initial_text = overview_page.get_text(*OverviewPage.VOTE_BUTTON)
        overview_page.vote_to_start()

        new_text = overview_page.get_text(*OverviewPage.VOTE_BUTTON)
        assert new_text != initial_text

        # Toggle back to maintain database state for re-runs
        overview_page.vote_to_start()

    def test_leave_proposal_dialog_cancel(self, user_proposal_member):
        """[LEAVE-1 / PR #121] Cancelling leave dialog retains membership."""
        overview_page = OverviewPage(user_proposal_member)
        overview_page.open()

        overview_page.open_leave_dialog()
        assert overview_page.is_visible(*OverviewPage.LEAVE_DIALOG)

        overview_page.cancel_leave()
        assert not overview_page.is_visible(*OverviewPage.LEAVE_DIALOG)

        # Still in kvintet
        assert overview_page.is_visible(*OverviewPage.FORMING_HEADING)

    def test_leave_proposal_confirm(self, driver, login_as):
        """[LEAVE-2] Confirming leave leaves proposal and shows empty state."""
        user = generate_random_user("leaver")
        api = ApiClient()
        api.sign_up(user["email"], user["password"], user["name"], user["username"])
        api.complete_onboarding()
        api.create_kvintet("Temp Leaving Kvintet", "Temporary group created to verify leaving flow.")

        login_as(user)

        overview_page = OverviewPage(driver)
        overview_page.open()

        assert overview_page.is_visible(*OverviewPage.FORMING_HEADING)

        overview_page.open_leave_dialog()
        overview_page.confirm_leave()

        # Overview should now indicate user left
        assert overview_page.is_visible(By.XPATH, "//*[contains(., 'Opustili jste') or contains(., 'Vyberte si')]")
