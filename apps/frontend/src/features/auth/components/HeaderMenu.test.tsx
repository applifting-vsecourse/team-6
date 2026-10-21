import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MobileAccount } from "@/features/auth/components/HeaderMenu"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const useSession = vi.fn<() => { user: { id: string; name: string; username: string } | null }>()
const signOut = vi.fn()

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => useSession() }))
vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({ mutate: signOut, isPending: false }),
}))

describe("MobileAccount", () => {
  beforeEach(() => {
    useSession.mockReset()
    signOut.mockReset()
  })

  it("renders nothing when signed out", () => {
    useSession.mockReturnValue({ user: null })
    const { container } = render(<MobileAccount />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the user and signs out on click", async () => {
    useSession.mockReturnValue({ user: { id: "u1", name: "Jana Nováková", username: "jana" } })
    render(<MobileAccount />)

    expect(screen.getByText("Jana Nováková")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }))

    expect(signOut).toHaveBeenCalledOnce()
  })
})
