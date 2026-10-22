import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import type { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"

import { MyKvintetPage } from "./MyKvintetPage"

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
}))

describe("MyKvintetPage", () => {
  beforeEach(() => {
    mockUseMyKvintet.mockReset()
  })

  it("renders empty state when user has no kvintet", () => {
    mockUseMyKvintet.mockReturnValue({
      data: null,
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
    })

    render(<MyKvintetPage />)

    expect(screen.getByText("You are not in any kvintet yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse proposals" })).toBeInTheDocument()
  })

  it("renders proposal view when kvintet is forming", () => {
    const mockProposal: KvintetDetails = {
      id: "k1",
      title: "Návrh kvintetu",
      status: "FORMING",
      createdAt: "2026-10-21T10:00:00.000Z",
      activatedAt: null,
      commonPreferences: "PRAHA",
      capacity: 5,
      openSeatsCount: 2,
      members: [
        {
          userId: "u1",
          name: "Jana",
          role: "Designérka",
          teachTags: ["UX"],
          learnTags: ["Code"],
          interestTags: ["Hry"],
          hasVoted: false,
          isCurrentUser: true,
        },
      ],
      voteStatus: {
        canVote: false,
        userHasVoted: false,
        votedCount: 0,
        totalCount: 1,
      },
    }

    mockUseMyKvintet.mockReturnValue({
      data: mockProposal,
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
    })

    render(<MyKvintetPage />)

    expect(screen.getByText("Proposal · 1 of 5")).toBeInTheDocument()
    expect(screen.getByText("Designérka (you)")).toBeInTheDocument()
  })

  it("renders active view when kvintet is active", () => {
    const mockActive: KvintetDetails = {
      id: "k1",
      title: "Aktivní skupina",
      status: "ACTIVE",
      createdAt: "2026-10-21T10:00:00.000Z",
      activatedAt: "2026-10-21T12:00:00.000Z",
      commonPreferences: "PRAHA",
      capacity: 5,
      openSeatsCount: 0,
      members: [
        {
          userId: "u1",
          name: "Jana Nováková",
          role: "Designérka",
          teachTags: ["UX"],
          learnTags: ["Code"],
          interestTags: ["Hry"],
          hasVoted: true,
          isCurrentUser: true,
        },
        {
          userId: "u2",
          name: "Petr Svoboda",
          role: "Vývojář",
          teachTags: ["TS"],
          learnTags: ["UX"],
          interestTags: ["Běh"],
          hasVoted: true,
          isCurrentUser: false,
        },
      ],
      voteStatus: {
        canVote: false,
        userHasVoted: true,
        votedCount: 2,
        totalCount: 2,
      },
    }

    mockUseMyKvintet.mockReturnValue({
      data: mockActive,
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
    })

    render(<MyKvintetPage />)

    expect(screen.getByText("Active kvintet")).toBeInTheDocument()
    expect(screen.getAllByText(/Petr Svoboda/).length).toBeGreaterThan(0)
  })
})
