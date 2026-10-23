import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetCard } from "@/features/kvintet/components/KvintetCard"

const kvintet: FeedKvintet = {
  id: "k1",
  title: "Using AI at work",
  category: "technology",
  capacity: 5,
  memberCount: 2,
  meetingFrequency: "BIWEEKLY",
  members: [
    {
      position: "Backend developer",
      teach: ["python", "sql"],
      learn: ["ux-design"],
      interests: ["startups"],
    },
    { position: null, teach: [], learn: [], interests: [] },
  ],
}

const renderCard = (overrides: Partial<FeedKvintet> = {}, onJoin = vi.fn()) => {
  render(
    <KvintetCard
      kvintet={{ ...kvintet, ...overrides }}
      isJoining={false}
      isDisabled={false}
      onJoin={onJoin}
    />,
  )
  return onJoin
}

describe("KvintetCard", () => {
  it("shows the topic, category and seats", () => {
    renderCard()

    expect(screen.getByRole("heading", { name: "Using AI at work" })).toBeInTheDocument()
    expect(screen.getByText("Technology")).toBeInTheDocument()
    expect(screen.getByText("2 of 5")).toBeInTheDocument()
  })

  it("describes each member by role and tags and marks the free seats", () => {
    renderCard()

    const [first, second] = screen.getAllByRole("listitem")
    if (!first || !second) throw new Error("expected a row per member")
    expect(within(first).getByText("Backend developer")).toBeInTheDocument()
    expect(
      within(first).getByText(
        "Teaches: Python and SQL · Wants to learn: UX design · Interests: Startups",
      ),
    ).toBeInTheDocument()
    // A member without a role yet still gets a row, never a name.
    expect(within(second).getByText("Member")).toBeInTheDocument()
    expect(screen.getAllByText("Free seat")).toHaveLength(3)
  })

  it("says the names stay hidden until the kvintet forms", () => {
    renderCard()

    expect(screen.getByText("You will see the names once the kvintet forms.")).toBeInTheDocument()
  })

  it("shows the shared meeting frequency only when there is one", () => {
    const { unmount } = render(
      <KvintetCard
        kvintet={kvintet}
        isJoining={false}
        isDisabled={false}
        onJoin={vi.fn()}
      />,
    )
    expect(screen.getByText("Suits everyone: every 14 days")).toBeInTheDocument()
    unmount()

    renderCard({ meetingFrequency: null })
    expect(screen.queryByText(/Suits everyone/)).not.toBeInTheDocument()
  })

  it("joins with the proposal id", async () => {
    const onJoin = renderCard()

    await userEvent.click(screen.getByRole("button", { name: "Join this proposal" }))

    expect(onJoin).toHaveBeenCalledWith("k1")
  })

  it("disables joining while another join is in flight", () => {
    render(
      <KvintetCard
        kvintet={kvintet}
        isJoining={false}
        isDisabled
        onJoin={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Join this proposal" })).toBeDisabled()
  })
})
