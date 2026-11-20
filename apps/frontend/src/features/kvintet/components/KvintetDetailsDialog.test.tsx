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

const renderDialog = (onJoin = vi.fn(), isDisabled = false) => {
  render(
    <KvintetDetailsDialog
      kvintet={kvintet}
      isJoining={false}
      isDisabled={isDisabled}
      onJoin={onJoin}
    />,
  )
  return onJoin
}

describe("KvintetDetailsDialog", () => {
  it("opens from the card with each member's role and what they teach, want to learn and like", async () => {
    renderDialog()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "See who's in" }))

    const dialog = await screen.findByRole("dialog", { name: "Using AI at work" })
    expect(within(dialog).getByText("We swap prompts that save time.")).toBeInTheDocument()
    expect(within(dialog).getByText("Backend developer")).toBeInTheDocument()
    expect(within(dialog).getByText("Member")).toBeInTheDocument()
    expect(within(dialog).getByText("Teaches").parentElement).toHaveTextContent(/Teaches\s*Python/)
    expect(within(dialog).getByText("Interests").parentElement).toHaveTextContent(
      /Interests\s*Startups/,
    )
    expect(within(dialog).getByText("Times that suit everyone:").parentElement).toHaveTextContent(
      "evenings · weekdays · every week",
    )
  })

  it("joins the kvintet from the dialog", async () => {
    const onJoin = renderDialog()

    await userEvent.click(screen.getByRole("button", { name: "See who's in" }))
    await userEvent.click(await screen.findByRole("button", { name: "Join" }))

    expect(onJoin).toHaveBeenCalledWith("k1")
  })

  it("disables Join while another join is in flight", async () => {
    renderDialog(vi.fn(), true)

    await userEvent.click(screen.getByRole("button", { name: "See who's in" }))

    expect(await screen.findByRole("button", { name: "Join" })).toBeDisabled()
  })
})
