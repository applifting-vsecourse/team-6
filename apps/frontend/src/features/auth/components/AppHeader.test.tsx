import type { ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppHeader } from "@/features/auth/components/AppHeader"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const useSession = vi.fn<() => { user: { id: string; name: string; username: string } | null }>()

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => useSession() }))
vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({ mutate: vi.fn(), isPending: false }),
}))
// The header only needs links to render; a real router is beside the point here.
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

const jana = { id: "u1", name: "Jana Nováková", username: "jana" }

describe("AppHeader", () => {
  beforeEach(() => useSession.mockReset())

  it("offers sign-in and sign-up and no navigation when signed out", () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader />)

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup")
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })

  it("invites a signed-out visitor to join from the mobile menu", async () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader />)

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))

    const menu = within(screen.getByRole("dialog"))
    expect(menu.getByText("Find your kvintet.")).toBeInTheDocument()
    expect(menu.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup")
    expect(menu.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
    expect(menu.getByRole("link", { name: "How Kvintet works" })).toHaveAttribute(
      "href",
      "/how-it-works",
    )
    expect(menu.getByRole("link", { name: "Community rules" })).toBeInTheDocument()
    expect(menu.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument()
  })

  it("puts the language switch in the mobile menu, with or without a session", async () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader hasAccount={false} />)

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))

    expect(
      within(screen.getByRole("dialog")).getByRole("radiogroup", { name: "Language" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument()
  })

  it("greys out a nav item that is unavailable and explains why in a tooltip", async () => {
    useSession.mockReturnValue({ user: jana })
    render(<AppHeader navDisabled={{ "/kvintet/feed": "You are already in a kvintet." }} />)

    const item = screen.getByRole("link", { name: "Kvintets" })
    expect(item).toHaveAttribute("aria-disabled", "true")
    expect(item).not.toHaveAttribute("href")
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/overview")

    await userEvent.hover(item)

    expect(await screen.findByRole("tooltip")).toHaveTextContent("You are already in a kvintet.")
  })

  it("shows navigation and the mobile menu when signed in", () => {
    useSession.mockReturnValue({ user: jana })
    render(<AppHeader />)

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument()
  })

  it("shows the account card, the chat and sign out in a signed-in user's mobile menu", async () => {
    useSession.mockReturnValue({ user: jana })
    render(<AppHeader chat={{ unreadCount: 2 }} />)

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))

    const menu = within(screen.getByRole("dialog"))
    expect(menu.getByText("@jana")).toBeInTheDocument()
    expect(menu.getByRole("link", { name: /Group chat/ })).toHaveAttribute(
      "href",
      "/kvintet/messages",
    )
    expect(menu.getByText("2 unread messages")).toBeInTheDocument()
    expect(menu.getByRole("button", { name: "Sign out" })).toBeInTheDocument()
    expect(menu.queryByText("Find your kvintet.")).not.toBeInTheDocument()
  })

  it("replaces the navigation with the step counter and a sign-out link while onboarding", () => {
    useSession.mockReturnValue({ user: jana })
    render(<AppHeader onboardingStep={{ current: 2, total: 3 }} />)

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument()
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Jana Nováková/ })).not.toBeInTheDocument()
  })

  it("ignores the onboarding step for someone who is signed out", () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader onboardingStep={{ current: 1, total: 3 }} />)

    expect(screen.queryByText("Step 1 of 3")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument()
  })

  it("offers Sign up instead of Sign in when hasAccount is false", () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader hasAccount={false} />)

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup")
  })
})
