import type { ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { HeaderMenu, MobileAccount, MobileSignOut } from "@/features/auth/components/HeaderMenu"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

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

const useSession = vi.fn<() => { user: { id: string; name: string; username: string } | null }>()
const signOut = vi.fn()

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => useSession() }))
vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({ mutate: signOut, isPending: false }),
}))

describe("MobileAccount", () => {
  beforeEach(() => useSession.mockReset())

  it("shows who is signed in, without any sign-out or profile link", () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<MobileAccount />)

    expect(screen.getByText("Jana Nováková")).toBeInTheDocument()
    expect(screen.getByText("@jana")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("leaves the @ out when there is no username", () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "" } })
    render(<MobileAccount />)

    expect(screen.queryByText(/^@/)).not.toBeInTheDocument()
  })
})

describe("MobileSignOut", () => {
  beforeEach(() => {
    useSession.mockReset()
    signOut.mockReset()
  })

  it("renders nothing when signed out", () => {
    useSession.mockReturnValue({ user: null })
    const { container } = render(<MobileSignOut />)

    expect(container).toBeEmptyDOMElement()
  })

  it("signs out on click", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<MobileSignOut />)

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }))

    expect(signOut).toHaveBeenCalledOnce()
  })
})

describe("HeaderMenu avatar", () => {
  beforeEach(() => useSession.mockReset())

  const avatarMarkup = (user: { id: string; name: string; username: string }) => {
    useSession.mockReturnValue({ user })
    const { container, unmount } = render(<HeaderMenu />)
    const markup = container.querySelector("[data-slot=avatar]")?.innerHTML
    unmount()
    return markup
  }

  it("is seeded by the username, and by the id when the username is empty", () => {
    const byUsername = avatarMarkup({ id: "u2", name: "Jana", username: "jana" })

    expect(byUsername).toBeTruthy()
    expect(avatarMarkup({ id: "jana", name: "Jana", username: "" })).toBe(byUsername)
    expect(avatarMarkup({ id: "u3", name: "Jana", username: "petr" })).not.toBe(byUsername)
  })
})

describe("HeaderMenu dropdown", () => {
  beforeEach(() => useSession.mockReset())

  it("shows name, @username and sign out, and no profile link yet", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<HeaderMenu />)

    await userEvent.click(screen.getByRole("button", { name: /^Jana/ }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("@jana")).toBeInTheDocument()
    expect(within(menu).getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
    expect(within(menu).queryByText("Profile")).not.toBeInTheDocument()
  })
})
