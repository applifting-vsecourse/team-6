import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { KvintetDetails, KvintetMember } from "@/features/kvintet/api/kvintetApi"
import type { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"

import { KvintetBeginsPage } from "./KvintetBeginsPage"

const mockUseMyKvintet = vi.fn<() => ReturnType<typeof useMyKvintet>>()
const mockMarkSeen = vi.fn()

vi.mock("@/features/kvintet/hooks/useMyKvintet", () => ({
  useMyKvintet: () => mockUseMyKvintet(),
}))

vi.mock("@/features/kvintet/hooks/useMarkBeginsSeen", () => ({
  useMarkBeginsSeen: () => ({ mutate: mockMarkSeen }),
}))

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const member = (id: string, name: string | null, isCurrentUser = false): KvintetMember => ({
  userId: id,
  username: null,
  name,
  role: null,
  teachTags: [],
  learnTags: [],
  interestTags: [],
  hasVoted: true,
  isCurrentUser,
})

const kvintet = (
  members: KvintetMember[],
  status: KvintetDetails["status"] = "ACTIVE",
  hasSeen = false,
) =>
  ({
    id: "k1",
    title: "AI v práci – co opravdu funguje",
    status,
    createdAt: "2026-10-21T10:00:00.000Z",
    activatedAt: "2026-10-22T16:00:00.000Z",
    commonPreferences: null,
    capacity: 5,
    openSeatsCount: 5 - members.length,
    members,
    voteStatus: { canVote: false, userHasVoted: true, votedCount: 0, totalCount: 0 },
    beginsSeen: hasSeen,
  }) satisfies KvintetDetails

const give = (data: KvintetDetails | null | undefined, extra: object = {}) =>
  mockUseMyKvintet.mockReturnValue({
    data,
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
    ...extra,
  })

const five = [
  member("u2", "Petr Svoboda"),
  member("u1", "Jana Nováková", true),
  member("u3", "Eva Horáková"),
  member("u4", "Ondřej Dvořák"),
  member("u5", "Lucie Králová"),
]

beforeEach(() => {
  mockUseMyKvintet.mockReset()
  mockMarkSeen.mockReset()
})

describe("KvintetBeginsPage", () => {
  it("greets a full kvintet with the topic, first names and you on top", () => {
    give(kvintet(five))

    const { container } = render(<KvintetBeginsPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "There are five of you. The kvintet begins." }),
    ).toBeInTheDocument()
    expect(screen.getByText("The fifth person joined")).toBeInTheDocument()
    expect(screen.getByText("AI v práci – co opravdu funguje")).toBeInTheDocument()
    expect(screen.getByText("Jana (you)")).toBeInTheDocument()
    for (const name of ["Petr", "Eva", "Ondřej", "Lucie"]) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    // The seat at the top is yours, even though the server listed Petr first.
    expect(container.querySelector("[data-seat]")).toHaveTextContent("Jana (you)")
    expect(container.querySelectorAll('[data-seat="free"]')).toHaveLength(0)
  })

  it("links to the group chat and to the members", () => {
    give(kvintet(five))

    render(<KvintetBeginsPage />)

    expect(screen.getByRole("link", { name: "Message the group" })).toHaveAttribute(
      "href",
      "/kvintet/messages",
    )
    expect(screen.getByRole("link", { name: "See members" })).toHaveAttribute("href", "/kvintet")
  })

  it("says how many there are and keeps free seats when fewer than five started", () => {
    give(kvintet(five.slice(0, 3)))

    const { container } = render(<KvintetBeginsPage />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "There are three of you. The kvintet begins.",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("The kvintet has started")).toBeInTheDocument()
    expect(container.querySelectorAll('[data-seat="member"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-seat="free"]')).toHaveLength(2)
  })

  it("falls back to the role, then to a numbered member, when there is no name", () => {
    give(kvintet([{ ...member("u1", null, true), role: "Designérka" }, member("u2", null)]))

    render(<KvintetBeginsPage />)

    expect(screen.getByText("Designérka (you)")).toBeInTheDocument()
    expect(screen.getByText("Member 2")).toBeInTheDocument()
  })

  it("treats an empty or blank name like a missing one", () => {
    give(kvintet([{ ...member("u1", "  ", true), role: "Designérka" }, member("u2", "")]))

    render(<KvintetBeginsPage />)

    expect(screen.getByText("Designérka (you)")).toBeInTheDocument()
    expect(screen.getByText("Member 2")).toBeInTheDocument()
  })

  it("tells the server the start was seen, but only while it has not been", () => {
    give(kvintet(five))
    const { unmount } = render(<KvintetBeginsPage />)
    expect(mockMarkSeen).toHaveBeenCalledTimes(1)
    unmount()
    mockMarkSeen.mockClear()

    give(kvintet(five, "ACTIVE", true))
    render(<KvintetBeginsPage />)
    expect(mockMarkSeen).not.toHaveBeenCalled()
  })

  it("sends a user without an active kvintet to My kvintet", () => {
    give(null)
    const { unmount } = render(<KvintetBeginsPage />)
    expect(screen.getByTestId("navigate")).toHaveTextContent(/^\/kvintet$/)
    unmount()

    give(kvintet(five, "FORMING"))
    render(<KvintetBeginsPage />)
    expect(screen.getByTestId("navigate")).toHaveTextContent(/^\/kvintet$/)
    expect(mockMarkSeen).not.toHaveBeenCalled()
  })

  it("shows an error with a retry", () => {
    const refetch = vi.fn()
    give(undefined, { isError: true, refetch })

    render(<KvintetBeginsPage />)

    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
  })
})
