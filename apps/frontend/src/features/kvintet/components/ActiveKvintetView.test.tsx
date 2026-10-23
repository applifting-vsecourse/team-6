import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"

import { ActiveKvintetView } from "./ActiveKvintetView"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("ActiveKvintetView", () => {
  // The chat belongs to another feature; the route hands it in.
  const renderChat = (currentUserId: string | undefined) => <div>chat for {currentUserId}</div>

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
        username: null,
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
        username: null,
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
        username: null,
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
        username: null,
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
        username: null,
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
        tab="overview"
        onTabChange={vi.fn()}
        renderChat={renderChat}
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

    // The chat is a tab, closed by default
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Messages" })).toBeInTheDocument()
    expect(screen.queryByText(/chat for/)).not.toBeInTheDocument()

    // Leave kvintet
    expect(screen.getByRole("button", { name: "Leave kvintet" })).toBeInTheDocument()
  })

  it("asks to open the messages tab when it is clicked", async () => {
    const handleTabChange = vi.fn()

    render(
      <ActiveKvintetView
        kvintet={mockActiveKvintet}
        tab="overview"
        onTabChange={handleTabChange}
        renderChat={renderChat}
        onLeave={vi.fn()}
        isLeaving={false}
      />,
    )
    await userEvent.click(screen.getByRole("tab", { name: "Messages" }))

    expect(handleTabChange).toHaveBeenCalledWith("messages")
  })

  it("shows the chat of the current member on the messages tab", () => {
    render(
      <ActiveKvintetView
        kvintet={mockActiveKvintet}
        tab="messages"
        onTabChange={vi.fn()}
        renderChat={renderChat}
        onLeave={vi.fn()}
        isLeaving={false}
      />,
    )

    expect(screen.getByText("chat for u1")).toBeInTheDocument()
    expect(screen.queryByText("Backend vývojář")).not.toBeInTheDocument()
  })
})
