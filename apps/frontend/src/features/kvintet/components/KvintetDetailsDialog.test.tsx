import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetDetailsDialog } from "@/features/kvintet/components/KvintetDetailsDialog"

// The grey blobatars use the gaze driver, which needs browser APIs jsdom lacks.
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const kvintet: FeedKvintet = {
  id: "k1",
  title: "Using AI at work",
  description: "We swap prompts that save time.",
  categories: ["software-development"],
  capacity: 5,
  memberCount: 2,
  meetingFrequency: "WEEKLY",
  commonAvailability: {
    weekdays: true,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: true,
  },
  members: [
    { position: "Backend developer", teach: ["python"], learn: ["ux-design"], interests: [] },
    { position: null, teach: [], learn: [], interests: ["startups"] },
  ],
  reasons: [],
}

const renderDialog = (onJoin = vi.fn(), isDisabled = false, isJoining = false) => {
  render(
    <KvintetDetailsDialog
      kvintet={kvintet}
      isJoining={isJoining}
      isDisabled={isDisabled}
      onJoin={onJoin}
    />,
  )
  return onJoin
}

describe("KvintetDetailsDialog", () => {
  it("opens from the card with the topic, each member by role and the free seats, nothing more", async () => {
    renderDialog()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "View" }))

    const dialog = await screen.findByRole("dialog", { name: "Using AI at work" })
    expect(within(dialog).getByText("Software development · 2 / 5")).toBeInTheDocument()
    expect(within(dialog).getByText("Backend developer")).toBeInTheDocument()
    expect(within(dialog).getByText("Member")).toBeInTheDocument()
    expect(within(dialog).getAllByText("Free")).toHaveLength(3)
    // The card's own information is not repeated, and a member's tags were never on the card.
    expect(within(dialog).queryByText("We swap prompts that save time.")).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Teaches/)).not.toBeInTheDocument()
  })

  it("joins the kvintet from the dialog", async () => {
    const onJoin = renderDialog()

    await userEvent.click(screen.getByRole("button", { name: "View" }))
    await userEvent.click(await screen.findByRole("button", { name: "Join" }))

    expect(onJoin).toHaveBeenCalledWith("k1")
  })

  it("disables Join while another join is in flight", async () => {
    renderDialog(vi.fn(), true)

    await userEvent.click(screen.getByRole("button", { name: "View" }))

    expect(await screen.findByRole("button", { name: "Join" })).toBeDisabled()
  })

  it("disables Join while this kvintet is being joined, so a second tap cannot join twice", async () => {
    renderDialog(vi.fn(), false, true)

    await userEvent.click(screen.getByRole("button", { name: "View" }))

    expect(await screen.findByRole("button", { name: "Join" })).toBeDisabled()
  })
})
