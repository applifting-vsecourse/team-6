import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"

import { KvintetTableDiagram } from "./KvintetTableDiagram"

describe("KvintetTableDiagram", () => {
  it("renders member labels with name, role, and localized fallback", () => {
    const members: KvintetMember[] = [
      {
        userId: "u1",
        name: "Jana Nováková",
        role: "Designer",
        teachTags: [],
        learnTags: [],
        interestTags: [],
        hasVoted: false,
        isCurrentUser: true,
      },
      {
        userId: "u2",
        name: null,
        role: "Developer",
        teachTags: [],
        learnTags: [],
        interestTags: [],
        hasVoted: false,
        isCurrentUser: false,
      },
      {
        userId: "u3",
        name: null,
        role: null,
        teachTags: [],
        learnTags: [],
        interestTags: [],
        hasVoted: false,
        isCurrentUser: false,
      },
    ]

    render(<KvintetTableDiagram members={members} />)

    // Current user label: Jana (you)
    expect(screen.getByText("Jana (you)")).toBeInTheDocument()
    // Member 2 label: Developer
    expect(screen.getByText("Developer")).toBeInTheDocument()
    // Member 3 label with translated fallback: Member 3
    expect(screen.getByText("Member 3")).toBeInTheDocument()
  })
})
