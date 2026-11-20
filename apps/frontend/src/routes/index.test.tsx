import type { ComponentType, ReactNode } from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

    // Once in the hero and once under the video.
    const create = screen.getAllByRole("link", { name: "Create account" })
    expect(create).toHaveLength(2)
    create.forEach((link) => expect(link).toHaveAttribute("href", "/signup"))
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
    const button = screen.getAllByRole("link", { name: "Create account" })[0]! // the hero one, the first on the page

    await user.hover(button)
    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: Let's get started!")

    await user.unhover(button)
    expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: silent")
  })

  describe("on a phone, which has nothing to hover with", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      window.matchMedia = ((query: string) => ({
        matches: query === "(hover: none)",
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
      vi.useRealTimers()
      // jsdom has none of its own.
      Reflect.deleteProperty(window, "matchMedia")
    })

    it("greets for a moment when the page opens, then goes quiet", () => {
      render(
        <MascotProvider>
          <MascotProbe />
          <LandingPage />
        </MascotProvider>,
      )
      expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: Let's get started!")

      act(() => void vi.advanceTimersByTime(4100))

      expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: silent")
    })

    it("greets again for a moment after a tap", () => {
      render(
        <MascotProvider>
          <MascotProbe />
          <LandingPage />
        </MascotProvider>,
      )
      act(() => void vi.advanceTimersByTime(4100))
      const button = screen.getAllByRole("link", { name: "Create account" })[0]! // the hero one, the first on the page

      fireEvent.pointerEnter(button, { pointerType: "touch" })
      expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: Let's get started!")

      // A finger never "leaves" the way a mouse does, so the greeting must go by itself.
      act(() => void vi.advanceTimersByTime(4100))
      expect(screen.getByTestId("mascot")).toHaveTextContent("landing-cta: silent")
    })
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

  it("shows the two-line headline, the core-idea animation and the video", () => {
    render(<LandingPage />)

    const title = screen.getByRole("heading", { level: 1 })
    expect(title).toHaveTextContent("Five people. One kvintet.")
    expect(title).toHaveTextContent("Learn from each other.")
    expect(screen.getByRole("img", { name: /find(s)? a kvintet/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "See how it works" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Kvintet in one minute" })).toBeInTheDocument()
    expect(screen.queryByText("Tell us about you", { selector: "h3" })).not.toBeInTheDocument()
  })

  it("links the hero to the video", () => {
    render(<LandingPage />)

    const watch = screen.getByRole("link", { name: "Watch the 1-minute video" })
    expect(watch).toHaveAttribute("href", "#video")
    expect(document.getElementById("video")).toContainElement(
      screen.getByRole("group", { name: "Kvintet in one minute" }),
    )
  })

  it("asks only a signed-out visitor to create an account under the video", () => {
    const video = () => document.getElementById("video")!
    render(<LandingPage />)
    expect(within(video()).getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/signup",
    )

    cleanup()
    session.user = { id: "u1" }
    render(<LandingPage />)
    expect(within(video()).queryByRole("link", { name: "Create account" })).not.toBeInTheDocument()
  })

  it("links to the rules", () => {
    render(<LandingPage />)

    expect(screen.getByRole("link", { name: "Read the rules" })).toHaveAttribute(
      "href",
      "/code-of-conduct",
    )
  })
})
