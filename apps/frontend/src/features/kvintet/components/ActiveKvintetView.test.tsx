import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"

import { ActiveKvintetView } from "./ActiveKvintetView"

describe("ActiveKvintetView", () => {
  const mockActiveKvintet: KvintetDetails = {
    id: "k1",
    title: "AI v práci – co opravdu funguje",
    status: "ACTIVE",
    createdAt: "2026-10-21T10:00:00.000Z",
    activatedAt: "2026-10-21T12:00:00.000Z",
    commonPreferences: {
      city: "Praha",
      meetingFrequency: "BIWEEKLY",
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: true,
    },
    capacity: 5,
    openSeatsCount: 0,
    members: [
      {
        userId: "u1",
        name: "Jana Nováková",
        role: "Marketingová specialistka",
        teachTags: ["Excel", "španělštinu"],
        learnTags: ["Python", "SQL"],
        interestTags: ["Turistika", "Deskové hry"],
        hasVoted: true,
        isCurrentUser: true,
      },
      {
        userId: "u2",
        name: "Petr Svoboda",
        role: "Backend vývojář",
        teachTags: ["Python", "SQL"],
        learnTags: ["UX design"],
        interestTags: ["Startupy"],
        hasVoted: true,
        isCurrentUser: false,
      },
      {
        userId: "u3",
        name: "Eva Horáková",
        role: "Datová analytička",
        teachTags: ["statistiku"],
        learnTags: ["vystupovat"],
        interestTags: ["Běh"],
        hasVoted: true,
        isCurrentUser: false,
      },
      {
        userId: "u4",
        name: "Ondřej Dvořák",
        role: "Produktový manažer",
        teachTags: ["roadmapping"],
        learnTags: ["vyjednávat"],
        interestTags: ["Deskové hry"],
        hasVoted: true,
        isCurrentUser: false,
      },
      {
        userId: "u5",
        name: "Lucie Malá",
        role: "UX designérka",
        teachTags: ["UX design"],
        learnTags: ["copywriting"],
        interestTags: ["Turistika"],
        hasVoted: true,
        isCurrentUser: false,
      },
    ],
    voteStatus: {
      canVote: false,
      userHasVoted: true,
      votedCount: 5,
      totalCount: 5,
    },
  }

  it("renders active kvintet with all member names, roles and interests visible", () => {
    const handleLeave = vi.fn()

    render(
      <ActiveKvintetView
        kvintet={mockActiveKvintet}
        onLeave={handleLeave}
        isLeaving={false}
      />,
    )

    // Status badge
    expect(screen.getByText("Active kvintet")).toBeInTheDocument()

    // Title
    expect(
      screen.getByRole("heading", { name: "AI v práci – co opravdu funguje" }),
    ).toBeInTheDocument()

    // Every other member's name is visible
    expect(screen.getAllByText(/Jana Nováková/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Petr Svoboda/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Eva Horáková/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ondřej Dvořák/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Lucie Malá/).length).toBeGreaterThan(0)

    // Roles
    expect(screen.getByText("Marketingová specialistka")).toBeInTheDocument()
    expect(screen.getByText("Backend vývojář")).toBeInTheDocument()
    expect(screen.getByText("Datová analytička")).toBeInTheDocument()
    expect(screen.getByText("Produktový manažer")).toBeInTheDocument()
    expect(screen.getByText("UX designérka")).toBeInTheDocument()

    // Group chat block
    expect(screen.getByText("Group chat")).toBeInTheDocument()
    const openMessagesButton = screen.getByRole("button", { name: "Open messages" })
    expect(openMessagesButton).toBeInTheDocument()
    expect(openMessagesButton).toBeDisabled()
    expect(screen.getByText("Group chat will be available soon.")).toBeInTheDocument()

    // Leave kvintet
    expect(screen.getByRole("button", { name: "Leave kvintet" })).toBeInTheDocument()
  })
})
