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
  Link: ({ children, to, className }: { children?: ReactNode; to: string; className?: string }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
}))

describe("AppHeader", () => {
  beforeEach(() => useSession.mockReset())

  it("offers sign-in and no navigation when signed out", () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader />)

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })

  it("puts the language switch in the mobile menu, with or without a session", async () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader hasAccount={false} />)

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))

    expect(
      within(screen.getByRole("dialog")).getByRole("group", { name: "Language" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })

  it("greys out a nav item that is unavailable and explains why in a tooltip", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<AppHeader navDisabled={{ "/kvintet/feed": "You are already in a proposal." }} />)

    const item = screen.getByRole("link", { name: "Proposals" })
    expect(item).toHaveAttribute("aria-disabled", "true")
    expect(item).not.toHaveAttribute("href")
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/overview")

    await userEvent.hover(item)

    expect(await screen.findByRole("tooltip")).toHaveTextContent("You are already in a proposal.")
  })

  it("shows navigation and the mobile menu when signed in", () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<AppHeader />)

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
  })

  it("leaves the account link out when hasAccount is false", () => {
    useSession.mockReturnValue({ user: null })
    render(<AppHeader hasAccount={false} />)

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument()
  })
})
