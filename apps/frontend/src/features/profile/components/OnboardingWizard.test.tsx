import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type * as ProfileApi from "@/features/profile/api/profileApi"

import { OnboardingWizard } from "./OnboardingWizard"

const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof Router>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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
            { id: "t_excel", slug: "excel" },
            { id: "t_python", slug: "python" },
          ],
        }),
    }),
    profileQueryOptions: () => ({
      queryKey: ["profile", "me"],
      queryFn: () => Promise.resolve(null),
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

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
  })

  it("walks through step 1, 2, 3 and submits the complete profile", async () => {
    mockMutateAsync.mockResolvedValue({})
    render(<OnboardingWizard />, { wrapper: createWrapper() })

    // Step 1
    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Select role Software Engineer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 2
    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Weekdays"))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    // Step 3
    expect(await screen.findByText("What do you expect from a kvintet?")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Learn something new"))
    await userEvent.click(screen.getByLabelText("Every week"))
    await userEvent.click(screen.getByRole("button", { name: "Finish" }))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ["software-engineer"],
        position: "software-engineer",
        weekdays: true,
        expectations: ["learn_new"],
        meetingFrequency: "WEEKLY",
        completeOnboarding: true,
      }),
    )
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/overview" })
  })

  it("supports going back to earlier steps", async () => {
    render(<OnboardingWizard />, { wrapper: createWrapper() })

    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Select role UX/UI Designer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByText("When and where can you meet?")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByText("Tell us about yourself")).toBeInTheDocument()
    expect(screen.getByText("UX/UI Designer")).toBeInTheDocument()
  })
})
