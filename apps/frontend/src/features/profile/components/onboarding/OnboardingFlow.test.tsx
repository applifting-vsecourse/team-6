import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type * as ProfileApi from "@/features/profile/api/profileApi"
import type { OnboardingPageId } from "@/features/profile/lib/onboardingPages"

import { OnboardingFlow } from "./OnboardingFlow"

vi.mock("@/features/profile/components/LocationMapPicker", () => ({
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

// The avatar is the mascot's business; here only what the flow tells it matters.
vi.mock("@/features/profile/components/onboarding/GuideAvatar", () => ({
  GuideAvatar: (props: { seed?: string; expression?: unknown; shakeKey?: number }) => (
    <div
      data-testid="avatar"
      data-seed={props.seed}
      data-happy={String(props.expression !== undefined)}
      data-shake={props.shakeKey}
    />
  ),
}))

const navigate = vi.hoisted(() => vi.fn())
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof Router>()
  return { ...actual, useNavigate: () => navigate }
})

const profileQueryFn = vi.hoisted(() => vi.fn())
const saveProfile = vi.hoisted(() => vi.fn())
vi.mock("@/features/profile/api/profileApi", async (importOriginal) => {
  const actual = await importOriginal<typeof ProfileApi>()
  return {
    ...actual,
    referenceQueryOptions: () => ({
      queryKey: ["reference"],
      queryFn: () =>
        Promise.resolve({
          cities: [],
          categories: [{ slug: "business" }, { slug: "software-development" }],
          tags: [
            { id: "1", slug: "excel", categories: ["business"] },
            { id: "2", slug: "python", categories: ["software-development"] },
            { id: "3", slug: "hiking", categories: [] },
          ],
        }),
    }),
    profileQueryOptions: () => ({ queryKey: ["profile", "me"], queryFn: profileQueryFn }),
    useSaveProfile: () => ({ mutateAsync: saveProfile, isPending: false }),
  }
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

// The route owns the page (it lives in the URL); this stands in for it.
function Flow({ start = "role", from }: { start?: OnboardingPageId; from?: "profile" }) {
  const [page, setPage] = useState<OnboardingPageId>(start)
  return (
    <OnboardingFlow
      userId="u1"
      seed="jana"
      page={page}
      from={from}
      onPageChange={setPage}
    />
  )
}

const open = async (start: OnboardingPageId = "role", from?: "profile") => {
  render(
    <Flow
      start={start}
      from={from}
    />,
    { wrapper },
  )
  await screen.findByRole("heading", { level: 1 })
}
const heading = () => screen.getByRole("heading", { level: 1 })
const press = (name: string) => userEvent.click(screen.getByRole("button", { name }))
const shakes = () => Number(screen.getByTestId("avatar").dataset.shake)

describe("OnboardingFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileQueryFn.mockResolvedValue(null)
    saveProfile.mockResolvedValue({})
    window.scrollTo = vi.fn()
  })

  it("asks one question per page, with the person's own avatar", async () => {
    await open()

    expect(heading()).toHaveTextContent("Start here: pick your field, then your role.")
    expect(screen.getByText("You can add more than one.")).toBeInTheDocument()
    expect(screen.getByTestId("avatar")).toHaveAttribute("data-seed", "jana")
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
  })

  it("walks through all eleven pages, saving each page's answers and completing on the last", async () => {
    await open()

    await press("Marketing & sales")
    await userEvent.click(screen.getByRole("button", { name: "Select role Copywriter" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ roles: ["copywriter"], position: "copywriter" })

    await press("Business")
    await userEvent.click(await screen.findByRole("button", { name: "Add tag Excel" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ teachTagIds: ["1"] })

    await userEvent.type(await screen.findByRole("textbox", { name: "Search topics" }), "pyth")
    await userEvent.click(screen.getByRole("button", { name: "Add tag Python" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ learnTagIds: ["2"] })

    await press("Continue") // interests: optional, left empty
    expect(saveProfile).toHaveBeenLastCalledWith({ interestTagIds: [] })

    expect(await screen.findByRole("heading", { name: "That's your profile!" })).toBeInTheDocument()
    saveProfile.mockClear()
    await press("On to step 2") // the summary asks nothing, so saves nothing
    expect(saveProfile).not.toHaveBeenCalled()

    await userEvent.click(await screen.findByRole("checkbox", { name: "Weekdays" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ weekdays: true, weekends: false })

    await userEvent.click(await screen.findByRole("checkbox", { name: "Evenings" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({
      mornings: false,
      afternoons: false,
      evenings: true,
    })

    await userEvent.click(await screen.findByRole("button", { name: "Pick on map" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({
      latitude: 50.07,
      longitude: 14.43,
      radiusKm: 10,
      cityId: null,
    })

    await userEvent.click(await screen.findByRole("checkbox", { name: "Learn something new" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ expectations: ["learn_new"] })

    await userEvent.click(await screen.findByRole("radio", { name: "Every week" }))
    await press("Continue")
    expect(saveProfile).toHaveBeenLastCalledWith({ meetingFrequency: "WEEKLY" })

    await userEvent.type(await screen.findByRole("textbox"), "  I bring my dog  ")
    expect(navigate).not.toHaveBeenCalled()
    await press("Done")

    expect(saveProfile).toHaveBeenLastCalledWith({
      note: "I bring my dog",
      completeOnboarding: true,
    })
    expect(navigate).toHaveBeenCalledWith({ to: "/overview" })
  })

  it("goes back without asking anything, and keeps the answers", async () => {
    await open()
    await press("Design")
    await userEvent.click(screen.getByRole("button", { name: "Select role UX Designer" }))
    await press("Continue")
    await screen.findByRole("heading", { name: "What could you teach the others?" })
    saveProfile.mockClear()

    await press("Back")

    expect(
      await screen.findByRole("button", { name: "Remove role UX Designer" }),
    ).toBeInTheDocument()
    expect(saveProfile).not.toHaveBeenCalled()
  })

  describe("when it was opened from the profile's Edit", () => {
    it("saves just that page and returns to the profile", async () => {
      await open("teach", "profile")
      await press("Business")
      await userEvent.click(await screen.findByRole("button", { name: "Add tag Excel" }))

      await press("Save")

      expect(saveProfile).toHaveBeenCalledTimes(1)
      expect(saveProfile).toHaveBeenCalledWith({ teachTagIds: ["1"] })
      expect(navigate).toHaveBeenCalledWith({ to: "/profile" })
      expect(heading()).toHaveTextContent("What could you teach the others?")
    })

    it("offers a way back to the profile, also on the first page, without saving", async () => {
      await open("role", "profile")

      await press("Back to profile")

      expect(saveProfile).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith({ to: "/profile" })
    })

    it("still asks for a missing required answer and stays", async () => {
      await open("days", "profile")

      await press("Save")

      expect(screen.getByRole("alert")).toHaveTextContent("Pick at least one day.")
      expect(saveProfile).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it("stays on the page when saving fails", async () => {
      saveProfile.mockRejectedValue(new Error("boom"))
      await open("teach", "profile")

      await press("Save")

      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe("when a required answer is missing", () => {
    it("shows what is missing in red, shakes the avatar's head, and saves nothing", async () => {
      await open()
      const before = shakes()

      await press("Continue")

      expect(
        screen.getByText("Pick at least one role so the others know what you do."),
      ).toHaveClass("text-destructive")
      expect(screen.getByRole("alert")).toHaveTextContent("Pick at least one role.")
      expect(shakes()).toBeGreaterThan(before)
      expect(saveProfile).not.toHaveBeenCalled()
      expect(heading()).toHaveTextContent("Start here")
    })

    it("shakes again each time it is tried again", async () => {
      await open()
      await press("Continue")
      const first = shakes()

      await press("Continue")

      expect(shakes()).toBeGreaterThan(first)
    })

    it("draws no frame around the answers", async () => {
      await open()
      await press("Continue")

      for (const element of document.querySelectorAll("form *")) {
        // The kit's `aria-invalid:` variants are dormant; what must not be there is the red frame itself.
        expect(element.className).not.toMatch(/(^|\s)(border-destructive|ring-destructive)/)
      }
    })

    it("takes the error away as soon as the person answers", async () => {
      await open()
      await press("Continue")

      await press("Design")
      await userEvent.click(screen.getByRole("button", { name: "Select role UX Designer" }))

      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(screen.getByText("You can add more than one.")).toBeInTheDocument()
    })

    it("does not carry the error over to the next page", async () => {
      await open("days")
      await press("Continue")
      expect(screen.getByRole("alert")).toBeInTheDocument()

      await userEvent.click(screen.getByRole("checkbox", { name: "Weekdays" }))
      await press("Continue")

      expect(
        await screen.findByRole("heading", { name: "And at what time of day?" }),
      ).toBeInTheDocument()
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it.each([
      ["days", "Pick at least one day."],
      ["time", "Pick at least one time of day."],
      ["place", "Pick a place on the map."],
      ["frequency", "Pick how often you'd like to meet."],
    ] as const)("holds the %s page to its answer", async (page, problem) => {
      await open(page)

      await press("Continue")

      expect(screen.getByRole("alert")).toHaveTextContent(problem)
      expect(saveProfile).not.toHaveBeenCalled()
    })

    it("lets the optional pages be left empty", async () => {
      await open("expectations")

      await press("Continue")

      expect(
        await screen.findByRole("heading", { name: "How often would you like to meet?" }),
      ).toBeInTheDocument()
    })

    it("holds a note to 300 characters", async () => {
      await open("note")
      await userEvent.click(screen.getByRole("textbox"))
      await userEvent.paste("x".repeat(301))

      expect(screen.getByText("301 / 300 · optional")).toHaveClass("text-destructive")
      await press("Done")

      expect(screen.getByRole("alert")).toHaveTextContent("Keep it to 300 characters.")
      expect(saveProfile).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe("when the server finds an answer missing", () => {
    it.each([
      ["PROFILE_ROLE_REQUIRED", "Start here: pick your field, then your role."],
      ["PROFILE_AVAILABILITY_REQUIRED", "Which days could you meet?"],
      ["PROFILE_LOCATION_REQUIRED", "Where would you like to meet?"],
      ["PROFILE_FREQUENCY_REQUIRED", "How often would you like to meet?"],
    ])("takes the person to the page for %s, showing the error", async (code, title) => {
      saveProfile.mockRejectedValueOnce(Object.assign(new Error("bad request"), { data: { code } }))
      await open("note")

      await press("Done")

      expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument()
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(navigate).not.toHaveBeenCalled()
    })

    it("says that saving failed, in words, and stays on the page", async () => {
      saveProfile.mockRejectedValueOnce(new Error("network"))
      await open("note")

      await press("Done")

      expect(await screen.findByRole("alert")).toHaveTextContent("An unexpected error occurred.")
      expect(heading()).toHaveTextContent("Anything else the group should know?")
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe("the place page", () => {
    it("says what to do first while there is no pin to drag", async () => {
      await open("place")

      expect(
        screen.getByText("Click the map or use your location. Others only see the distance."),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Drag the pin/)).not.toBeInTheDocument()
    })

    it("talks about dragging the pin once there is one", async () => {
      profileQueryFn.mockResolvedValue({
        roles: [],
        teaches: [],
        learns: [],
        interests: [],
        latitude: 50,
        longitude: 14,
      })
      await open("place")

      expect(screen.getByText(/^Drag the pin and pick how far/)).toBeInTheDocument()
    })

    it("changes its hint as soon as the pin is dropped", async () => {
      await open("place")

      await userEvent.click(screen.getByRole("button", { name: "Pick on map" }))

      expect(screen.getByText(/^Drag the pin and pick how far/)).toBeInTheDocument()
    })
  })

  it("starts from what is saved, so a reload on a later page loses nothing", async () => {
    profileQueryFn.mockResolvedValue({
      roles: ["copywriter"],
      teaches: [],
      learns: [],
      interests: [],
      latitude: 49.19,
      longitude: 16.6,
      radiusKm: 30,
      meetingFrequency: "MONTHLY",
    })
    await open("place")

    await press("Continue") // the place is already there

    expect(saveProfile).toHaveBeenLastCalledWith({
      latitude: 49.19,
      longitude: 16.6,
      radiusKm: 30,
      cityId: null,
    })
  })

  describe("the summary", () => {
    it("shows the answers of step 1, with a happy avatar", async () => {
      profileQueryFn.mockResolvedValue({
        roles: ["copywriter"],
        teaches: [{ id: "1", slug: "excel" }],
        learns: [{ id: "2", slug: "python" }],
        interests: [],
      })
      await open("summary")

      expect(screen.getByText("Copywriter")).toBeInTheDocument()
      expect(screen.getByText("Excel")).toBeInTheDocument()
      expect(screen.getByText("Python")).toBeInTheDocument()
      expect(screen.getByText("Nothing yet")).toBeInTheDocument()
      expect(screen.getByTestId("avatar")).toHaveAttribute("data-happy", "true")
    })

    it("goes back to a question with its Edit", async () => {
      profileQueryFn.mockResolvedValue({
        roles: ["copywriter"],
        teaches: [],
        learns: [],
        interests: [],
      })
      await open("summary")

      await press("Edit: I can teach")

      expect(
        await screen.findByRole("heading", { name: "What could you teach the others?" }),
      ).toBeInTheDocument()
    })

    it("is the only page with a happy avatar", async () => {
      await open("teach")

      expect(screen.getByTestId("avatar")).toHaveAttribute("data-happy", "false")
    })
  })

  it("names the button after what it does", async () => {
    await open("summary")
    expect(screen.getByRole("button", { name: "On to step 2" })).toBeInTheDocument()
  })
})
