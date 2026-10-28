import type { ComponentType, ReactNode } from "react"
import type * as ReactQuery from "@tanstack/react-query"
import type * as ReactRouter from "@tanstack/react-router"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Route } from "@/routes/_ProtectedPages/overview"

const membership = vi.hoisted(() => ({ isMember: false }))
const deleteAccountMutate = vi.fn()

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", name: "Jana Nováková" } }),
}))
vi.mock("@/features/kvintet/hooks/useKvintetMembership", () => ({
  useKvintetMembership: () => membership,
}))
vi.mock("@/features/account/hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({ mutate: deleteAccountMutate, isPending: false }),
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: () => ({ data: undefined }),
}))
// The page only needs links to render; a real router is beside the point here.
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouter>()),
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const OverviewPage = Route.options.component as ComponentType

describe("OverviewPage", () => {
  beforeEach(() => {
    membership.isMember = false
    deleteAccountMutate.mockReset()
  })

  it("links 'See proposals' to the proposal feed", () => {
    render(<OverviewPage />)

    expect(screen.getByRole("link", { name: "See proposals" })).toHaveAttribute(
      "href",
      "/kvintet/feed",
    )
  })

  // TEMPORARY: covers the stopgap member variant; revisit with the overview redesign.
  it("sends a kvintet member to their kvintet instead of the proposals", () => {
    membership.isMember = true
    render(<OverviewPage />)

    expect(screen.getByRole("link", { name: "Go to my kvintet" })).toHaveAttribute(
      "href",
      "/kvintet",
    )
    expect(screen.queryByRole("link", { name: "See proposals" })).not.toBeInTheDocument()
  })

  it("opens delete account dialog from profile card and confirms deletion", async () => {
    render(<OverviewPage />)

    const triggerButton = screen.getByRole("button", { name: "Delete account" })
    expect(triggerButton).toBeInTheDocument()

    fireEvent.click(triggerButton)

    expect(await screen.findByRole("heading", { name: "Delete account" })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete your account\?/i)).toBeInTheDocument()

    // Confirm button in dialog (the trigger button is aria-hidden while dialog is open)
    const confirmButton = screen.getByRole("button", { name: "Delete account" })
    fireEvent.click(confirmButton)

    expect(deleteAccountMutate).toHaveBeenCalledOnce()
  })
})
