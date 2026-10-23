import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"

import { KvintetTableDiagram } from "./KvintetTableDiagram"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("KvintetTableDiagram", () => {
  it("renders a blobatar per member, labelled with name, role, or localized fallback", async () => {
    const members: KvintetMember[] = [
      {
        userId: "u1",
        username: null,
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
        username: null,
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
        username: null,
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

    expect(screen.getByRole("img", { name: "Jana Nováková (you)" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Developer" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Member 3" })).toBeInTheDocument()

    await userEvent.hover(screen.getByRole("img", { name: "Jana Nováková (you)" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Jana Nováková (you)")
  })
})
