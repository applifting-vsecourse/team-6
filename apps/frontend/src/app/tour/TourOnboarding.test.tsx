import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"

import type * as ProfileApi from "@/features/profile/api/profileApi"
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard"

import { TourController } from "./TourController"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))
vi.mock("@/features/profile/components/LocationMapPicker", () => ({
  DEFAULT_RADIUS_KM: 25,
  LocationMapPicker: () => null,
}))

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof Router>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useRouterState: ({ select }: { select: (state: { location: object }) => unknown }) =>
      select({ location: { pathname: "/onboarding", search: { step: 1 } } }),
  }
})

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", username: "zong" } }),
}))

const profile = vi.hoisted(() => ({ current: null as object | null }))
vi.mock("@/features/profile/api/profileApi", async (importOriginal) => {
  const actual = await importOriginal<typeof ProfileApi>()
  return {
    ...actual,
    referenceQueryOptions: () => ({
      queryKey: ["reference"],
      queryFn: () => Promise.resolve({ cities: [], tags: [{ id: "1", slug: "excel" }] }),
    }),
    profileQueryOptions: () => ({
      queryKey: ["profile", "me"],
      queryFn: () => Promise.resolve(profile.current),
    }),
    useSaveProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})

function Probe() {
  const stage = useMascotContext()?.stage
  return (
    <>
      <p data-testid="anchor">{stage?.anchorId ?? "none"}</p>
      <p data-testid="text">{stage?.bubble?.text ?? "none"}</p>
      <p data-testid="seed">{stage?.seed ?? "none"}</p>
    </>
  )
}

const renderOnboarding = () => {
  window.scrollTo = vi.fn()
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MascotProvider>
        <Probe />
        <TourController />
        <OnboardingWizard
          userId="u1"
          mascotSeed="zong"
          step={1}
          onStepChange={vi.fn()}
        />
      </MascotProvider>
    </QueryClientProvider>,
  )
}

describe("the tour in onboarding", () => {
  it("advises a new person from the first card, as their own avatar", async () => {
    profile.current = null
    renderOnboarding()

    expect(await screen.findByText("Tell us about you")).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(screen.getByTestId("anchor")).toHaveTextContent("onboarding-role"),
    )
    expect(screen.getByTestId("seed")).toHaveTextContent("zong")
    expect(screen.getByTestId("text")).toHaveTextContent("pick your field")
    // The mascot is the avatar, so the one beside the title stays out.
    expect(screen.queryByRole("img", { hidden: true })).toBeNull()
  })

  it("leaves the avatar beside the title, and no advice, to someone who has done the tour", async () => {
    profile.current = {
      tourCompletedAt: "2026-11-10T10:00:00.000Z",
      onboardingCompletedAt: "2026-11-10T10:00:00.000Z",
      roles: [],
      expectations: [],
      meetingFrequency: null,
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false,
      note: null,
      userId: "u1",
      teaches: [],
      learns: [],
      interests: [],
    }
    const { container } = renderOnboarding()

    expect(await screen.findByText("Tell us about you")).toBeInTheDocument()
    await userEvent.click(document.body)
    expect(screen.getByTestId("anchor")).toHaveTextContent("none")
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
