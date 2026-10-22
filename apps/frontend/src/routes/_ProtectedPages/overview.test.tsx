import type { ComponentType, ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Route } from "@/routes/_ProtectedPages/overview"

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", name: "Jana Nováková" } }),
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ data: undefined }),
}))
// The page only needs links to render; a real router is beside the point here.
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const OverviewPage = Route.options.component as ComponentType

describe("OverviewPage", () => {
  it("links 'See proposals' to the proposal feed", () => {
    render(<OverviewPage />)

    expect(screen.getByRole("link", { name: "See proposals" })).toHaveAttribute(
      "href",
      "/kvintet/feed",
    )
  })
})
