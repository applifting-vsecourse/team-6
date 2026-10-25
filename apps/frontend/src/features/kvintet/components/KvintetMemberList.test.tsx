import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"
import { KvintetMemberList } from "@/features/kvintet/components/KvintetMemberList"

const member: KvintetMember = {
  userId: "u1",
  name: "Eva Nováková",
  username: "eva",
  role: "qa-engineer, backend-developer",
  teachTags: ["python", "sql"],
  learnTags: ["ux-design"],
  interestTags: ["startups"],
  hasVoted: false,
  isCurrentUser: false,
}

describe("KvintetMemberList", () => {
  it("shows translated role and tag labels, not slugs", () => {
    render(
      <KvintetMemberList
        members={[member]}
        isActive
      />,
    )

    expect(screen.getByText("QA / Test Engineer, Backend Developer")).toBeInTheDocument()
    // One line per category.
    expect(screen.getByText("Teaches").closest("p")).toHaveTextContent("Teaches Python and SQL")
    expect(screen.getByText("Wants to learn").closest("p")).toHaveTextContent(
      "Wants to learn UX design",
    )
    expect(screen.getByText("Interests").closest("p")).toHaveTextContent("Interests Startups")
    // The prefixes carry their own emphasis so teaching and learning read apart.
    expect(screen.getByText("Teaches")).toHaveClass("text-foreground")
    expect(screen.getByText("Wants to learn")).toHaveClass("text-foreground")
  })

  it("keeps a free-text position as it is", () => {
    render(
      <KvintetMemberList
        members={[{ ...member, role: "Graphic designer" }]}
        isActive={false}
      />,
    )

    expect(screen.getByText("Graphic designer")).toBeInTheDocument()
  })

  it("translates the role slugs in the proposal heading", () => {
    render(
      <KvintetMemberList
        members={[member]}
        isActive={false}
      />,
    )

    expect(screen.getByText("QA / Test Engineer, Backend Developer")).toBeInTheDocument()
  })

  it.each([null, ""])(
    "falls back to the name, then to an open seat, when the role is %j",
    (role) => {
      render(
        <KvintetMemberList
          members={[
            {
              ...member,
              role,
              name: "Eva Nováková",
              teachTags: [],
              learnTags: [],
              interestTags: [],
            },
            {
              ...member,
              userId: "u2",
              role,
              name: null,
              teachTags: [],
              learnTags: [],
              interestTags: [],
            },
          ]}
          totalSeats={2}
          isActive={false}
        />,
      )

      expect(screen.getByText("Eva Nováková")).toBeInTheDocument()
      expect(screen.getAllByText("Open seat")).toHaveLength(1)
    },
  )
})
