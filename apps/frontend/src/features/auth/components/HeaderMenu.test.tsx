import type { ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"
import { Sheet } from "@/components/ui/sheet"

import {
  HeaderMenu,
  MobileAccount,
  MobileReplayTour,
  MobileSignOut,
} from "@/features/auth/components/HeaderMenu"

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

  // SheetClose needs the sheet's dialog context, as in the real mobile menu.
  const renderInSheet = () =>
    render(
      <Sheet>
        <MobileAccount />
      </Sheet>,
    )

  it("shows who is signed in as a link to the profile, without a sign-out button", () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    renderInSheet()

    expect(screen.getByText("Jana Nováková")).toBeInTheDocument()
    expect(screen.getByText("View your profile")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Jana Nováková/ })).toHaveAttribute("href", "/profile")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("never prints a handle, only the profile link text", () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "" } })
    renderInSheet()

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

describe("MobileReplayTour", () => {
  beforeEach(() => useSession.mockReset())

  // The provider's own counter is what the tour controller watches for a replay.
  function ReplayCount() {
    return <p>replays: {useMascotContext()?.replayToken}</p>
  }
  const renderInSheet = () =>
    render(
      <MascotProvider>
        <Sheet>
          <MobileReplayTour />
        </Sheet>
        <ReplayCount />
      </MascotProvider>,
    )

  it("renders nothing when signed out", () => {
    useSession.mockReturnValue({ user: null })
    renderInSheet()

    expect(screen.queryByRole("button", { name: "Replay the tour" })).not.toBeInTheDocument()
  })

  it("replays the tour on click", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    renderInSheet()

    await userEvent.click(screen.getByRole("button", { name: "Replay the tour" }))

    expect(screen.getByText("replays: 1")).toBeInTheDocument()
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

  it("shows name, @username, profile link and sign out", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<HeaderMenu />)

    await userEvent.click(screen.getByRole("button", { name: /^Jana/ }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("@jana")).toBeInTheDocument()
    expect(within(menu).getByRole("link", { name: "Profile" })).toBeInTheDocument()
    expect(within(menu).getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
  })
})
