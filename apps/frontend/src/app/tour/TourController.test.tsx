import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"

import { TourController } from "./TourController"

const router = vi.hoisted(() => ({ pathname: "/onboarding" }))
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (state: { location: object }) => unknown }) =>
    select({ location: { pathname: router.pathname, search: {} } }),
}))

const session = vi.hoisted(() => {
  const state: { user: { id: string; username: string } | null } = {
    user: { id: "u1", username: "zong" },
  }
  return state
})
vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => session }))

const profile = vi.hoisted(() => ({ current: null as object | null }))
vi.mock("@/features/profile/api/profileApi", () => ({
  profileQueryOptions: () => ({
    queryKey: ["profile", "me"],
    queryFn: () => Promise.resolve(profile.current),
  }),
  markTourCompleted: vi.fn(),
  profileKeys: { me: () => ["profile", "me"] },
}))

function Probe() {
  const mascot = useMascotContext()
  return (
    <>
      <p data-testid="tour">{mascot?.isTourActive ? "running" : "idle"}</p>
      <p data-testid="stage">{mascot?.stage?.anchorId ?? "none"}</p>
    </>
  )
}

const renderController = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MascotProvider>
        <Probe />
        <TourController />
      </MascotProvider>
    </QueryClientProvider>,
  )

describe("TourController", () => {
  beforeEach(() => {
    router.pathname = "/onboarding"
    session.user = { id: "u1", username: "zong" }
    profile.current = null
  })

  it("runs the tour for a new person who has no profile yet", async () => {
    renderController()

    await waitFor(() => expect(screen.getByTestId("tour")).toHaveTextContent("running"))
  })

  it("does not run it for someone who has been through it", async () => {
    profile.current = { tourCompletedAt: "2026-11-10T10:00:00.000Z", onboardingCompletedAt: "x" }
    renderController()

    await waitFor(() => expect(screen.getByTestId("tour")).toHaveTextContent("idle"))
    // Give a late answer the chance to change its mind.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.getByTestId("tour")).toHaveTextContent("idle")
  })

  it("has nothing to run without a signed-in person", () => {
    session.user = null
    renderController()

    expect(screen.getByTestId("tour")).toHaveTextContent("idle")
  })

  it("leaves onboarding to its own cards, and takes Home once onboarding is done", async () => {
    profile.current = { tourCompletedAt: null, onboardingCompletedAt: "2026-11-10T10:00:00.000Z" }
    router.pathname = "/overview"
    renderController()

    await waitFor(() => expect(screen.getByTestId("stage")).toHaveTextContent("tour-page"))
  })
})
