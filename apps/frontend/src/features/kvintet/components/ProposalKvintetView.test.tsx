import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"

import { ProposalKvintetView } from "./ProposalKvintetView"

describe("ProposalKvintetView", () => {
  const mockKvintet: KvintetDetails = {
    id: "k1",
    title: "AI v práci – co opravdu funguje",
    status: "FORMING",
    createdAt: "2026-10-21T10:00:00.000Z",
    activatedAt: null,
    commonPreferences: "PRAHA · VEČERY · JEDNOU ZA 14 DNÍ",
    capacity: 5,
    openSeatsCount: 1,
    members: [
      {
        userId: "u1",
        name: "Jana Nováková",
        role: "Marketingová specialistka",
        teachTags: ["Excel", "španělštinu"],
        learnTags: ["Python", "SQL"],
        interestTags: ["Turistika", "Deskové hry"],
        hasVoted: false,
        isCurrentUser: true,
      },
      {
        userId: "u2",
        name: null, // Hidden in proposal view
        role: "Backend vývojář",
        teachTags: ["Python", "SQL"],
        learnTags: ["UX design"],
        interestTags: ["Startupy"],
        hasVoted: true,
        isCurrentUser: false,
      },
      {
        userId: "u3",
        name: null,
        role: "Datová analytička",
        teachTags: ["statistiku"],
        learnTags: ["vystupovat"],
        interestTags: ["Běh"],
        hasVoted: true,
        isCurrentUser: false,
      },
      {
        userId: "u4",
        name: null,
        role: "Produktový manažer",
        teachTags: ["roadmapping"],
        learnTags: ["vyjednávat"],
        interestTags: ["Deskové hry"],
        hasVoted: true,
        isCurrentUser: false,
      },
    ],
    voteStatus: {
      canVote: true,
      userHasVoted: false,
      votedCount: 3,
      totalCount: 4,
    },
  }

  it("renders proposal status, vote banner, and member roles without other members' names", () => {
    const handleVote = vi.fn()
    const handleLeave = vi.fn()

    render(
      <ProposalKvintetView
        kvintet={mockKvintet}
        onVote={handleVote}
        isVoting={false}
        onLeave={handleLeave}
        isLeaving={false}
      />,
    )

    // Status badge
    expect(screen.getByText("Proposal · 4 of 5")).toBeInTheDocument()

    // Title & subtitle
    expect(
      screen.getByRole("heading", { name: "AI v práci – co opravdu funguje" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("SUITS EVERYONE: PRAHA · VEČERY · JEDNOU ZA 14 DNÍ"),
    ).toBeInTheDocument()

    // Vote banner
    expect(screen.getByText("Start now?")).toBeInTheDocument()
    expect(screen.getByText("3 of 4 members want to start now.")).toBeInTheDocument()
    expect(
      screen.getByText(
        "The kvintet starts immediately once all members vote yes (1 needed). With 5 members, it forms automatically.",
      ),
    ).toBeInTheDocument()

    const voteButton = screen.getByRole("button", { name: "Yes, start now" })
    expect(voteButton).toBeInTheDocument()
    fireEvent.click(voteButton)
    expect(handleVote).toHaveBeenCalledTimes(1)

    // Member roles are visible
    expect(screen.getByText("Marketingová specialistka (you)")).toBeInTheDocument()
    expect(screen.getByText("Backend vývojář")).toBeInTheDocument()
    expect(screen.getByText("Datová analytička")).toBeInTheDocument()
    expect(screen.getByText("Produktový manažer")).toBeInTheDocument()

    // Empty 5th seat
    expect(screen.getByText("Open seat")).toBeInTheDocument()
    expect(screen.getByText("Waiting for the fifth member.")).toBeInTheDocument()

    // Names of other members are NOT visible
    expect(screen.queryByText("Petr Svoboda")).not.toBeInTheDocument()

    // Vote badges
    expect(screen.getAllByText("For").length).toBe(3)
    expect(screen.getByText("Not voted")).toBeInTheDocument()

    // Leave proposal action
    expect(screen.getByRole("button", { name: "Leave proposal" })).toBeInTheDocument()
  })

  it("renders explanation when there are fewer than 3 members and voting hasn't started yet", () => {
    const fewMembersKvintet: KvintetDetails = {
      ...mockKvintet,
      members: [mockKvintet.members[0]!],
      voteStatus: {
        canVote: false,
        userHasVoted: false,
        votedCount: 0,
        totalCount: 1,
      },
    }

    render(
      <ProposalKvintetView
        kvintet={fewMembersKvintet}
        onVote={vi.fn()}
        isVoting={false}
        onLeave={vi.fn()}
        isLeaving={false}
      />,
    )

    expect(screen.getByText("Early start voting")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Voting opens when 3 members join (currently 1 of 5). With 3 or 4 members, a kvintet can start early if everyone agrees. With 5 members, it forms automatically.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Yes, start now" })).not.toBeInTheDocument()
  })
})
