import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type * as ProfileApi from "@/features/profile/api/profileApi"

import { OnboardingWizard, type OnboardingStep } from "./OnboardingWizard"

vi.mock("@/features/profile/components/LocationMapPicker", () => ({
  DEFAULT_RADIUS_KM: 25,
  LocationMapPicker: ({
    onChange,
  }: {
    onChange: (loc: { latitude: number; longitude: number; radiusKm: number }) => void
  }) => (
    <button
      type="button"
      onClick={() => onChange({ latitude: 50.07, longitude: 14.43, radiusKm: 10 })}
    >
      Pick on map
    </button>
  ),
}))

const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof Router>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockProfileQueryFn = vi.fn().mockImplementation(() => Promise.resolve(null))
const mockMutateAsync = vi.fn()
vi.mock("@/features/profile/api/profileApi", async (importOriginal) => {
  const actual = await importOriginal<typeof ProfileApi>()
  return {
    ...actual,
    referenceQueryOptions: () => ({
      queryKey: ["reference"],
      queryFn: () =>
        Promise.resolve({
          cities: [{ id: "c_praha", name: "Praha", lat: 50.07, lng: 14.43 }],
          tags: [
            { id: "1", slug: "excel" },
            { id: "2", slug: "python" },
          ],
        }),
    }),
    profileQueryOptions: () => ({
      queryKey: ["profile", "me"],
      queryFn: mockProfileQueryFn,
    }),
    useSaveProfile: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// The route owns the step (it lives in the URL); this stands in for it.
function Wizard() {
  const [step, setStep] = useState<OnboardingStep>(1)
  return (
    <OnboardingWizard
      step={step}
      onStepChange={setStep}
    />
  )
}

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
  })

  it("walks through step 1, 2, 3 and submits the complete profile", async () => {
    mockMutateAsync.mockResolvedValue({})
    render(<Wizard />, { wrapper: createWrapper() })

    // Step 1
    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Tech & dev" }))
    await userEvent.click(screen.getByRole("button", { name: "Select role Software Engineer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 2
    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Weekdays"))
    await userEvent.click(screen.getByLabelText("Evenings"))
    await userEvent.click(screen.getByRole("button", { name: "Pick on map" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 3
    expect(await screen.findByText("What do you expect from the group?")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Learn something new"))
    await userEvent.click(screen.getByLabelText("Every week"))
    await userEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ["software-engineer"],
        position: "software-engineer",
        weekdays: true,
        evenings: true,
        cityId: null,
        latitude: 50.07,
        longitude: 14.43,
        radiusKm: 10,
        expectations: ["learn_new"],
        meetingFrequency: "WEEKLY",
        completeOnboarding: true,
      }),
    )
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/overview" })
  })

  it("keeps a saved map location when the user does not touch the map", async () => {
    mockMutateAsync.mockResolvedValue({})
    mockProfileQueryFn.mockResolvedValueOnce({
      roles: ["software-engineer"],
      position: "software-engineer",
      weekdays: true,
      latitude: 49.19,
      longitude: 16.6,
      radiusKm: 30,
      meetingFrequency: "WEEKLY",
      expectations: ["learn_new"],
    })
    render(<Wizard />, { wrapper: createWrapper() })

    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Evenings"))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    await userEvent.click(await screen.findByRole("button", { name: "Done" }))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ cityId: null, latitude: 49.19, longitude: 16.6, radiusKm: 30 }),
    )
  })

  it("supports going back to earlier steps", async () => {
    render(<Wizard />, { wrapper: createWrapper() })

    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Design" }))
    await userEvent.click(screen.getByRole("button", { name: "Select role UX/UI Designer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    expect(screen.getByText("UX/UI Designer")).toBeInTheDocument()
  })

  it("shows the step the route gives it", async () => {
    render(
      <OnboardingWizard
        step={2}
        onStepChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    expect(screen.queryByText("Tell us about yourself")).not.toBeInTheDocument()
  })

  it("asks the route to change the step instead of keeping one of its own", async () => {
    const onStepChange = vi.fn()
    render(
      <OnboardingWizard
        step={1}
        onStepChange={onStepChange}
      />,
      { wrapper: createWrapper() },
    )

    await userEvent.click(await screen.findByRole("button", { name: "Design" }))

    await userEvent.click(await screen.findByRole("button", { name: "Select role UX/UI Designer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onStepChange).toHaveBeenCalledWith(2)
    // Still step 1 until the route updates the URL and passes the new step back.
    expect(screen.getByText("Tell us about yourself")).toBeInTheDocument()
  })

  it("renders error alert when profile query fails", async () => {
    mockProfileQueryFn.mockRejectedValueOnce(new Error("Network Error fetching profile"))

    render(<Wizard />, { wrapper: createWrapper() })

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
  })
})
