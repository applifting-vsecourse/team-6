import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Footer } from "@/components/Footer"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    hash,
    className,
  }: {
    children?: ReactNode
    to: string
    hash?: string
    className?: string
  }) => (
    <a
      href={hash ? `${to}#${hash}` : to}
      className={className}
    >
      {children}
    </a>
  ),
}))

describe("Footer", () => {
  it("links to how it works, the rules and support", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: "How Kvintet works" })).toHaveAttribute(
      "href",
      "/how-it-works",
    )
    expect(screen.getByRole("link", { name: "Rules" })).toHaveAttribute("href", "/code-of-conduct")
    // jsdom applies no CSS, so both the short and the long label are in the name.
    expect(screen.getByRole("link", { name: /Contact support/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    )
  })

  it("closes with the year", () => {
    render(<Footer />)

    expect(screen.getByText(`Kvintet · ${new Date().getFullYear()}`)).toBeInTheDocument()
  })
})
