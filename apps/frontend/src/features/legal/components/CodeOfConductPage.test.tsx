import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SUPPORT_EMAIL } from "@/config/support"

import { CodeOfConductPage } from "@/features/legal/components/CodeOfConductPage"

describe("CodeOfConductPage", () => {
  it("shows the five numbered rules under the Community rules title", () => {
    render(<CodeOfConductPage />)

    expect(screen.getByRole("heading", { level: 1, name: "Community rules" })).toBeInTheDocument()
    const rules = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(rules).toHaveLength(5)
    expect(rules[0]).toHaveTextContent("01Be kind. No insults.")
    expect(rules[4]).toHaveTextContent("05Can't come? Let the others know.")
  })

  it("tells people where to report a problem", () => {
    render(<CodeOfConductPage />)

    expect(screen.getByRole("heading", { level: 2, name: "Something wrong?" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: SUPPORT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
    )
  })
})
