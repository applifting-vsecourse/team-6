import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetCard } from "@/features/kvintet/components/KvintetCard"

const commonAvailability = {
  weekdays: false,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: false,
}

const kvintet: FeedKvintet = {
  id: "k1",
  title: "Using AI at work",
  categories: ["software-development", "business"],
  capacity: 5,
  memberCount: 2,
  meetingFrequency: "BIWEEKLY",
  commonAvailability,
  members: [
    {
      position: "Backend developer",
      teach: ["python", "sql"],
      learn: ["ux-design"],
      interests: ["startups"],
    },
    { position: null, teach: [], learn: [], interests: [] },
  ],
  reasons: [
    { code: "learn", tag: "python" },
    { code: "topic", category: "data-ai" },
    { code: "frequency" },
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
  it("shows the topic, every category and how many seats are taken", () => {
    renderCard()

    expect(screen.getByRole("heading", { name: "Using AI at work" })).toBeInTheDocument()
    expect(screen.getByText("Software development")).toBeInTheDocument()
    expect(screen.getByText("Business")).toBeInTheDocument()
    expect(screen.getByText("2 / 5")).toBeInTheDocument()
  })

  it("says why the kvintet suits the user, in one line with translated tags and categories", () => {
    renderCard()

    expect(
      screen.getByText(
        "Someone here teaches Python · Your topic: Data & AI · Same meeting frequency",
      ),
    ).toBeInTheDocument()
  })

  it("shows no reasons when there are none", () => {
    renderCard({ reasons: [] })

    expect(screen.queryByText("Why it suits you:")).not.toBeInTheDocument()
  })

  it("shows each member by role only, then the free seats, five in total", () => {
    renderCard()

    const seats = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(seats.map((seat) => seat.textContent)).toEqual([
      "Backend developer",
      // A member without a role yet still gets a seat, never a name.
      "Member",
      "Free",
      "Free",
      "Free",
    ])
    // A member's tags are not on the card.
    expect(screen.queryByText(/Teaches/)).not.toBeInTheDocument()
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
    expect(screen.getByText("Every two weeks")).toBeInTheDocument()
    unmount()

    renderCard({ meetingFrequency: null })
    expect(screen.queryByText("Every two weeks")).not.toBeInTheDocument()
  })

  it("joins with the kvintet id", async () => {
    const onJoin = renderCard()

    await userEvent.click(screen.getByRole("button", { name: "Join" }))

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

    expect(screen.getByRole("button", { name: "Join" })).toBeDisabled()
  })
})
