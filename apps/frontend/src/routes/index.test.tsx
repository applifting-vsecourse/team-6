import type { ComponentType, ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"
import { Route } from "@/routes/index"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const session = vi.hoisted(() => ({ user: null as { id: string } | null }))

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => session }))
// The header has its own tests; this page only needs its content and links.
vi.mock("@/app/SiteHeader", () => ({ SiteHeader: () => null }))
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

function MascotProbe() {
  const stage = useMascotContext()?.stage
  return (
    <p data-testid="mascot">
      {stage ? `${stage.anchorId}: ${stage.bubble?.text ?? "silent"}` : "none"}
    </p>
  )
}

describe("LandingPage", () => {
  beforeEach(() => {
    session.user = null
  })

  it("offers an account and sign-in to someone signed out", () => {
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup")
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
    expect(screen.queryByRole("link", { name: "Go to Home" })).not.toBeInTheDocument()
  })

  it("puts the yellow mascot on the corner of the button, silent until it is pointed at", () => {
    render(
      <MascotProvider>
        <MascotProbe />
        <LandingPage />
      </MascotProvider>,
    )

    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: silent")
  })

  it("greets while the button is hovered and goes quiet when the pointer leaves", async () => {
    const user = userEvent.setup()
    render(
      <MascotProvider>
        <MascotProbe />
        <LandingPage />
      </MascotProvider>,
    )
    const button = screen.getByRole("link", { name: "Create account" })

    await user.hover(button)
    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: Let's get started!")

    await user.unhover(button)
    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: silent")
  })

  it("greets a keyboard user who focuses the button too", async () => {
    const user = userEvent.setup()
    render(
      <MascotProvider>
        <MascotProbe />
        <LandingPage />
      </MascotProvider>,
    )

    await user.tab()
    // The page's first stop may be another control; tab on until the button has focus.
    for (let i = 0; i < 5 && document.activeElement?.textContent !== "Create account"; i++) {
      await user.tab()
    }

    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: Let's get started!")
  })

  it("keeps the mascot away from someone who already has an account", () => {
    session.user = { id: "u1" }
    render(
      <MascotProvider>
        <MascotProbe />
        <LandingPage />
      </MascotProvider>,
    )

    expect(screen.getByTestId("mascot")).toHaveTextContent("none")
  })

  it("sends someone signed in to the overview and offers no account", () => {
    session.user = { id: "u1" }
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/overview")
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
  })

  it("shows the headline, the core-idea animation and the three steps", () => {
    render(<LandingPage />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Learn from each other.")
    expect(screen.getByRole("img", { name: /find(s)? a kvintet/i })).toBeInTheDocument()
    const steps = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(steps).toHaveLength(3)
    expect(steps[0]).toHaveTextContent("Tell us about you")
    expect(steps[2]).toHaveTextContent("Meet up")
  })

  it("carries the shorter phone copy next to the desktop copy", () => {
    render(<LandingPage />)
    // The animation repeats some of this copy in its captions; the steps are the list.
    const steps = within(screen.getByRole("list"))

    // CSS picks one of the two; jsdom has no CSS, so both are in the page.
    expect(steps.getByText("What you know and what you'd like to learn.")).toBeInTheDocument()
    expect(
      steps.getByText("What you know and what you'd like to learn. 3 minutes."),
    ).toBeInTheDocument()
    expect(steps.getByText("Names stay hidden until it starts.")).toBeInTheDocument()
    expect(steps.getByText("An algorithm finds the kvintet that fits you.")).toBeInTheDocument()
  })

  it("links to the rules", () => {
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Read the rules" })).toHaveAttribute(
      "href",
      "/code-of-conduct",
    )
  })
})
