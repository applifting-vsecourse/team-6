import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EmptyKvintetState } from "./EmptyKvintetState"

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

describe("EmptyKvintetState", () => {
  it("renders empty state message and link to proposals feed", () => {
    render(<EmptyKvintetState feedRoute="/kvintet/feed" />)

    expect(screen.getByText("You are not in any kvintet yet")).toBeInTheDocument()
    expect(
      screen.getByText("Your group will appear here once you join a proposal."),
    ).toBeInTheDocument()

    const link = screen.getByRole("link", { name: "Browse proposals" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/kvintet/feed")
  })
})
