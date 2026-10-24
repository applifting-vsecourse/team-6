import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import type { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"

import { KvintetMessagesPage } from "./KvintetMessagesPage"

const mockUseMyKvintet = vi.fn<() => ReturnType<typeof useMyKvintet>>()

vi.mock("@/features/kvintet/hooks/useMyKvintet", () => ({
  useMyKvintet: () => mockUseMyKvintet(),
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children?: ReactNode; to: string; className?: string }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  Navigate: ({ to }: { to: string }) => <p>navigated to {to}</p>,
}))

const member = (userId: string, name: string, isCurrentUser = false) => ({
  userId,
  name,
  username: null,
  role: null,
  teachTags: [],
  learnTags: [],
  interestTags: [],
  hasVoted: true,
  isCurrentUser,
})

const kvintet = (status: "ACTIVE" | "FORMING"): KvintetDetails => ({
  id: "k1",
  title: "AI v práci – co opravdu funguje",
  status,
  createdAt: "2026-10-21T10:00:00.000Z",
  activatedAt: "2026-10-21T12:00:00.000Z",
  commonPreferences: null,
  capacity: 5,
  openSeatsCount: 0,
  members: [member("u1", "Jana Nováková", true), member("u2", "Petr Svoboda")],
  voteStatus: { canVote: false, userHasVoted: true, votedCount: 2, totalCount: 2 },
})

const state = (overrides: Partial<ReturnType<typeof useMyKvintet>>) =>
  mockUseMyKvintet.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn() as never,
    vote: vi.fn(),
    isVoting: false,
    voteError: null,
    leave: vi.fn(),
    isLeaving: false,
    leaveError: null,
    ...overrides,
  })

describe("KvintetMessagesPage", () => {
  beforeEach(() => mockUseMyKvintet.mockReset())

  it("shows the kvintet title, a way back, its members and the chat", () => {
    state({ data: kvintet("ACTIVE") })

    render(<KvintetMessagesPage renderChat={(id) => <p>chat for {id}</p>} />)

    expect(
      screen.getByRole("heading", { name: "AI v práci – co opravdu funguje" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "My kvintet" })).toHaveAttribute("href", "/kvintet")
    expect(
      screen.getByText("Jana Nováková, Petr Svoboda · only members can read the messages"),
    ).toBeInTheDocument()
    expect(screen.getByText("chat for u1")).toBeInTheDocument()
  })

  it.each([
    ["a kvintet that is still forming", { data: kvintet("FORMING") }],
    ["no kvintet at all", { data: null }],
  ])("sends the user back to My kvintet for %s", (_name, overrides) => {
    state(overrides)

    render(<KvintetMessagesPage renderChat={() => <p>chat</p>} />)

    expect(screen.getByText("navigated to /kvintet")).toBeInTheDocument()
    expect(screen.queryByText("chat")).not.toBeInTheDocument()
  })

  it("shows an error with a retry instead of redirecting when loading failed", () => {
    state({ isError: true })

    render(<KvintetMessagesPage renderChat={() => <p>chat</p>} />)

    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
    expect(screen.queryByText(/navigated to/)).not.toBeInTheDocument()
  })
})
