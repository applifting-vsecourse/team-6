import type { ComponentType, ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Route } from "@/routes/index"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const session = vi.hoisted(() => ({ user: null as { id: string } | null }))

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => session }))
// The header has its own tests; this page only needs its content and links.
vi.mock("@/features/auth/components/AppHeader", () => ({ AppHeader: () => null }))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children?: ReactNode; to: string; className?: string }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
  createFileRoute: () => (options: object) => ({ options }),
}))

const LandingPage = Route.options.component as ComponentType

describe("LandingPage", () => {
  beforeEach(() => {
    session.user = null
  })

  it("offers an account and sign-in to someone signed out", () => {
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup")
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
    expect(screen.queryByRole("link", { name: "Go to overview" })).not.toBeInTheDocument()
  })

  it("sends someone signed in to the overview and offers no account", () => {
    session.user = { id: "u1" }
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Go to overview" })).toHaveAttribute(
      "href",
      "/overview",
    )
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
  })

  it("shows the headline, a table of five and the three steps", () => {
    const { container } = render(<LandingPage />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Five people. One kvintet. Learn from each other.",
    )
    expect(container.querySelectorAll('[data-seat="member"]')).toHaveLength(5)
    const steps = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(steps).toHaveLength(3)
    expect(steps[0]).toHaveTextContent("Tell us about you")
    expect(steps[2]).toHaveTextContent("Meet up")
  })

  it("carries the shorter phone copy next to the desktop copy", () => {
    render(<LandingPage />)

    // CSS picks one of the two; jsdom has no CSS, so both are in the page.
    expect(screen.getByText("What you know and what you'd like to learn.")).toBeInTheDocument()
    expect(
      screen.getByText("What you know and what you'd like to learn. 3 minutes."),
    ).toBeInTheDocument()
    expect(screen.getByText("Names stay hidden until it starts.")).toBeInTheDocument()
    expect(
      screen.getByText("Choose by topic. Names stay hidden until it starts."),
    ).toBeInTheDocument()
  })

  it("links to the rules", () => {
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Read the rules" })).toHaveAttribute(
      "href",
      "/code-of-conduct",
    )
  })
})
