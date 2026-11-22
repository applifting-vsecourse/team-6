import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SUPPORT_EMAIL } from "@/config/support"

import { PrivacyPage } from "./PrivacyPage"

describe("PrivacyPage", () => {
  it("has one heading, a section for each topic of the notice and the contact address", () => {
    render(<PrivacyPage />)

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(6)
    expect(screen.getByText(/Controller: to be named/)).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: SUPPORT_EMAIL }).length).toBeGreaterThan(0)
  })
})
