import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MobileAccount } from "@/features/auth/components/HeaderMenu"

const useSession = vi.fn<() => { user: { name: string; username: string } | null }>()
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
    useSession.mockReturnValue({ user: { name: "Jana Nováková", username: "jana" } })
    render(<MobileAccount />)

    expect(screen.getByText("Jana Nováková")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Odhlásit se" }))

    expect(signOut).toHaveBeenCalledOnce()
  })
})
