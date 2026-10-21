import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
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
    expect(screen.queryByRole("button", { name: "Open menu" })).not.toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
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
