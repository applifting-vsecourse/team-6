import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"

import { TourController } from "./TourController"

// One `navigate` for the whole file, as the real hook gives: a new one per render would make
// the tour's stage new every render too.
const router = vi.hoisted(() => ({ pathname: "/onboarding", navigate: vi.fn() }))
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => router.navigate,
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
const markTourCompleted = vi.hoisted(() => vi.fn(() => Promise.resolve(null)))
vi.mock("@/features/profile/api/profileApi", () => ({
  profileQueryOptions: () => ({
    queryKey: ["profile", "me"],
    queryFn: () => Promise.resolve(profile.current),
  }),
  markTourCompleted,
  profileKeys: { me: () => ["profile", "me"] },
}))

function Probe() {
  const mascot = useMascotContext()
  return (
    <>
      <p data-testid="tour">{mascot?.isTourActive ? "running" : "idle"}</p>
      <p data-testid="stage">{mascot?.stage?.anchorId ?? "none"}</p>
      {mascot?.stage?.bubble?.onClose ? (
        <button onClick={mascot.stage.bubble.onClose}>cross</button>
      ) : null}
      {mascot?.stage?.bubble?.actions?.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
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
    markTourCompleted.mockClear()
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

  describe("on Home, after onboarding", () => {
    beforeEach(() => {
      profile.current = { tourCompletedAt: null, onboardingCompletedAt: "2026-11-10T10:00:00.000Z" }
      router.pathname = "/overview"
    })

    it("ends with the cross: the mascot flies to the header and the tour is saved as done", async () => {
      renderController()
      await waitFor(() => expect(screen.getByTestId("stage")).toHaveTextContent("tour-page"))

      await userEvent.click(screen.getByRole("button", { name: "cross" }))

      expect(screen.getByTestId("stage")).toHaveTextContent("header-avatar")
      expect(markTourCompleted).toHaveBeenCalledOnce()
    })

    it("says goodbye at the header, and is gone after Done", async () => {
      renderController()
      await waitFor(() => expect(screen.getByTestId("stage")).toHaveTextContent("tour-page"))
      await userEvent.click(screen.getByRole("button", { name: "cross" }))

      await userEvent.click(screen.getByRole("button", { name: "Done" }))

      expect(screen.getByTestId("stage")).toHaveTextContent("none")
      expect(screen.getByTestId("tour")).toHaveTextContent("idle")
      // Saved once, when it flew home; "Done" has nothing left to save.
      expect(markTourCompleted).toHaveBeenCalledOnce()
    })
  })
})
