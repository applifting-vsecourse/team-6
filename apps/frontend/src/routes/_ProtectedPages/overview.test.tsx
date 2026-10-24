import type { ComponentType, ReactNode } from "react"
import type * as ReactQuery from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Route } from "@/routes/_ProtectedPages/overview"

const membership = vi.hoisted(() => ({ isMember: false }))

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", name: "Jana Nováková" } }),
}))
vi.mock("@/features/kvintet/hooks/useKvintetMembership", () => ({
  useKvintetMembership: () => membership,
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactQuery>()),
  useQuery: () => ({ data: undefined }),
}))
// The page only needs links to render; a real router is beside the point here.
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const OverviewPage = Route.options.component as ComponentType

describe("OverviewPage", () => {
  beforeEach(() => {
    membership.isMember = false
  })

  it("links 'See proposals' to the proposal feed", () => {
    render(<OverviewPage />)

    expect(screen.getByRole("link", { name: "See proposals" })).toHaveAttribute(
      "href",
      "/kvintet/feed",
    )
  })

  it("sends a kvintet member to their kvintet instead of the proposals", () => {
    membership.isMember = true
    render(<OverviewPage />)

    expect(screen.getByRole("link", { name: "Go to my kvintet" })).toHaveAttribute(
      "href",
      "/kvintet",
    )
    expect(screen.queryByRole("link", { name: "See proposals" })).not.toBeInTheDocument()
  })
})
