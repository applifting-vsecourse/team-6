import type { ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { TFunction } from "i18next"
import { HTTPError } from "ky"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SUPPORT_EMAIL } from "@/config/support"

import type { ProfileResponse } from "@/features/profile/api/profileApi"
import type { useProfile } from "@/features/profile/hooks/useProfile"

import { formatDays, formatPlace, formatTimes, ProfilePage, Route } from "./profile"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({
    children,
    to,
    search,
    className,
  }: {
    children?: ReactNode
    to: string
    search?: { page: string; from?: string }
    className?: string
  }) => (
    <a
      href={search ? `${to}?${new URLSearchParams(search)}` : to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

const mockUseProfile = vi.fn<(...args: unknown[]) => ReturnType<typeof useProfile>>()

vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: (...args: unknown[]) => mockUseProfile(...args),
}))

const mockDeleteMutate = vi.fn()
let isDeletePending = false

vi.mock("@/features/account/hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({
    mutate: mockDeleteMutate,
    isPending: isDeletePending,
  }),
}))

const defaultUser = {
  id: "u-1",
  name: "Jana Nováková",
  username: "jana.novakova",
}

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: defaultUser }),
}))

const mockProfile: ProfileResponse = {
  userId: "u-1",
  position: "Marketing specialist",
  roles: ["marketing-specialist"],
  latitude: 50.0755,
  longitude: 14.4378,
  expectations: [],
  meetingFrequency: "BIWEEKLY",
  weekdays: true,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: true,
  cityId: "c-1",
  cityName: "Prague",
  radiusKm: 10,
  note: null,
  onboardingCompletedAt: "2026-10-21T10:00:00Z",
  teaches: [
    { id: "t-1", slug: "excel" },
    { id: "t-2", slug: "spanish" },
    { id: "t-3", slug: "social-media" },
  ],
  learns: [
    { id: "t-4", slug: "python" },
    { id: "t-5", slug: "sql" },
  ],
  interests: [
    { id: "t-6", slug: "running" },
    { id: "t-7", slug: "reading" },
  ],
}

function mockProfileData(
  overrides?: Partial<ReturnType<typeof useProfile>>,
): ReturnType<typeof useProfile> {
  return {
    profile: mockProfile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isDeletePending = false
  })

  it("calls useProfile with user.id to hit the query cache warmed by loader", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    expect(mockUseProfile).toHaveBeenCalledWith("u-1")
  })

  it("renders large blobatar in the header with alt text / accessible title", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    const avatar = document.body.querySelector("[data-slot=avatar]")
    expect(avatar).toBeInTheDocument()
    // Accessible title per AC: standing alone so it gets alt text (blobatar={{ title: name }})
    expect(avatar?.querySelector("title")).toHaveTextContent("Jana Nováková")
  })

  it("renders user identity details", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByRole("heading", { name: "Jana Nováková" })).toBeInTheDocument()
    expect(screen.getByText(/@jana.novakova · Marketing Specialist/)).toBeInTheDocument()
    expect(screen.queryByText(/marketing-specialist/)).not.toBeInTheDocument()
  })

  it("labels the position when the profile has no roles", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({ profile: { ...mockProfile, roles: [], position: "qa-engineer" } }),
    )

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByText(/@jana.novakova · QA/)).toBeInTheDocument()
    expect(screen.queryByText(/qa-engineer/)).not.toBeInTheDocument()
  })

  it("shows the role and the expectations, each with an edit link to its onboarding step", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: { ...mockProfile, expectations: ["learn_new", "share_knowledge"] },
      }),
    )

    render(<ProfilePage user={defaultUser} />)

    const role = screen.getByRole("heading", { name: "My role" }).closest("section")!
    expect(role).toHaveTextContent("Marketing & sales · Marketing Specialist")
    expect(role).not.toHaveTextContent("marketing-specialist")
    expect(within(role).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/onboarding?page=role&from=profile",
    )

    const expects = screen.getByRole("heading", { name: "What you expect" }).closest("section")!
    expect(expects).toHaveTextContent("Learn something new · Share what I know")
    expect(within(expects).getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/onboarding?page=expectations&from=profile",
    )
  })

  it("renders teach, learn and interest tag sections with an edit link to its own onboarding page", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    // Teach section
    expect(screen.getByRole("heading", { name: "I can teach" })).toBeInTheDocument()
    expect(screen.getByText("Excel")).toBeInTheDocument()
    expect(screen.getByText("Spanish")).toBeInTheDocument()
    expect(screen.getByText("Social media")).toBeInTheDocument()

    // Learn section
    expect(screen.getByRole("heading", { name: "I want to learn" })).toBeInTheDocument()
    expect(screen.getByText("Python")).toBeInTheDocument()
    expect(screen.getByText("SQL")).toBeInTheDocument()

    // Interests section
    expect(screen.getByRole("heading", { name: "I'm interested in" })).toBeInTheDocument()
    expect(screen.getByText("Running")).toBeInTheDocument()
    expect(screen.getByText("Reading")).toBeInTheDocument()

    // Each Edit link opens the page of its own section
    const links = screen.getAllByRole("link", { name: "Edit" })
    expect(links.length).toBe(10) // every onboarding page except the summary has one
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/onboarding?page=role&from=profile",
      "/onboarding?page=teach&from=profile",
      "/onboarding?page=learn&from=profile",
      "/onboarding?page=interests&from=profile",
      "/onboarding?page=days&from=profile",
      "/onboarding?page=time&from=profile",
      "/onboarding?page=place&from=profile",
      "/onboarding?page=expectations&from=profile",
      "/onboarding?page=frequency&from=profile",
      "/onboarding?page=note&from=profile",
    ])
  })

  it("shows days, time, place, frequency and note, each in a row with its own edit link", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({ profile: { ...mockProfile, note: "I bring my dog" } }),
    )

    render(<ProfilePage user={defaultUser} />)

    const row = (label: string) => screen.getByText(label).closest("div")!.parentElement!
    expect(screen.getByRole("heading", { name: "When and where" })).toBeInTheDocument()
    expect(row("Days")).toHaveTextContent("Weekdays")
    expect(row("Time of day")).toHaveTextContent("Evenings")
    expect(row("Place")).toHaveTextContent("Prague, within 10 km")
    expect(row("How often")).toHaveTextContent("Every two weeks")
    expect(row("Note")).toHaveTextContent("I bring my dog")
    expect(within(row("Note")).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/onboarding?page=note&from=profile",
    )
  })

  it("renders empty state messages when profile tags are empty", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: {
          ...mockProfile,
          teaches: [],
          learns: [],
          interests: [],
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
          cityName: null,
          radiusKm: null,
          meetingFrequency: null,
        },
      }),
    )

    render(<ProfilePage user={defaultUser} />)

    const emptyTags = screen.getAllByText("Nothing added yet")
    expect(emptyTags.length).toBe(5) // teach, learn, interests, expectations, note
    expect(screen.getAllByText("No preferences set yet").length).toBe(4) // days, time, place, how often
  })

  it("tells where to ask for a copy of the stored data, without offering a download", () => {
    mockUseProfile.mockReturnValue(mockProfileData())
    render(<ProfilePage />)

    const heading = screen.getByRole("heading", { level: 2, name: "Your data" })
    const section = within(heading.closest("section")!)
    expect(section.getByRole("link", { name: SUPPORT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
    )
    expect(section.getByText(/within one month/)).toBeInTheDocument()
    expect(section.queryByRole("button")).not.toBeInTheDocument()
  })

  it("opens real delete account dialog and confirms account deletion", async () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    const deleteSection = screen.getByRole("heading", { name: "Delete account" })
    expect(deleteSection).toBeInTheDocument()
    expect(screen.getByText("Removes everything. Can't be undone.")).toBeInTheDocument()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    // Click Delete account button in danger zone
    const deleteButton = screen.getByRole("button", { name: "Delete account" })
    await userEvent.click(deleteButton)

    // Real DeleteAccountDialog opens
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete your account\?/i)).toBeInTheDocument()

    // Click confirm Delete account button inside dialog
    const confirmButton = within(dialog).getByRole("button", { name: "Delete account" })
    await userEvent.click(confirmButton)

    expect(mockDeleteMutate).toHaveBeenCalledOnce()
  })

  it("closes delete account dialog when cancel is clicked without triggering deletion", async () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    const deleteButton = screen.getByRole("button", { name: "Delete account" })
    await userEvent.click(deleteButton)

    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()

    const cancelButton = within(dialog).getByRole("button", { name: "Cancel" })
    await userEvent.click(cancelButton)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(mockDeleteMutate).not.toHaveBeenCalled()
  })

  it("renders loading state when isLoading is true", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: null,
        isLoading: true,
      }),
    )

    const { container } = render(<ProfilePage user={defaultUser} />)

    const skeletons = container.querySelectorAll("[data-slot=skeleton]")
    expect(skeletons.length).toBeGreaterThan(0)
    expect(screen.queryByRole("heading", { name: "Jana Nováková" })).not.toBeInTheDocument()
  })

  it("renders error alert with retry button when isError is true", async () => {
    const mockRefetch = vi.fn().mockResolvedValue({})
    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: null,
        isError: true,
        error: new Error("Server error"),
        refetch: mockRefetch,
      }),
    )

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByText("Couldn't load profile")).toBeInTheDocument()
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
    const retryBtn = screen.getByRole("button", { name: "Try again" })
    await userEvent.click(retryBtn)
    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it("renders specific translated server error from getErrorMessage", () => {
    const error = new HTTPError(
      new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      new Request("http://localhost/api/profile/u-1"),
      {} as never,
    )
    Object.assign(error, { data: { code: "unauthorized" } })

    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: null,
        isError: true,
        error,
      }),
    )

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByText("Couldn't load profile")).toBeInTheDocument()
    expect(screen.getByText("You need to sign in first.")).toBeInTheDocument()
  })

  it("falls back to user id when username is an empty string", async () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(
      <ProfilePage
        user={{
          id: "u-fallback-123",
          name: "Test User",
          username: "",
        }}
      />,
    )

    const avatar = document.body.querySelector("[data-slot=avatar]")
    expect(avatar).toBeInTheDocument()

    // Open delete dialog and verify dialog avatar also renders
    const deleteButton = screen.getByRole("button", { name: "Delete account" })
    await userEvent.click(deleteButton)

    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    const dialogAvatar = dialog.querySelector("[data-slot=avatar]")
    expect(dialogAvatar).toBeInTheDocument()
  })

  it("links to the privacy notice", () => {
    mockUseProfile.mockReturnValue(mockProfileData())
    render(<ProfilePage />)

    expect(screen.getByRole("link", { name: "privacy notice" })).toHaveAttribute("href", "/privacy")
  })
})

describe("row values", () => {
  const tMock = ((key: string, options?: { count?: number }) => {
    const translations: Record<string, string> = {
      "profile.when.allDays": "All days",
      "onboarding.days.weekdays": "Weekdays",
      "onboarding.days.weekends": "Weekends",
      "onboarding.time.mornings": "Mornings",
      "onboarding.time.afternoons": "Afternoons",
      "onboarding.time.evenings": "Evenings",
    }
    if (key === "profile.withinRadius") return `within ${options?.count ?? 0} km`
    return translations[key] ?? key
  }) as unknown as TFunction
  const none = {
    ...mockProfile,
    weekdays: false,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: false,
    cityName: null,
    radiusKm: null,
  }

  it("is empty when nothing is set, also without a profile", () => {
    for (const profile of [null, none]) {
      expect(formatDays(profile, tMock)).toBe("")
      expect(formatTimes(profile, tMock)).toBe("")
      expect(formatPlace(profile, tMock)).toBe("")
    }
  })

  it("names the days, with both as all days", () => {
    expect(formatDays({ ...none, weekdays: true }, tMock)).toBe("Weekdays")
    expect(formatDays({ ...none, weekends: true }, tMock)).toBe("Weekends")
    expect(formatDays({ ...none, weekdays: true, weekends: true }, tMock)).toBe("All days")
  })

  it("lists the times of day in order", () => {
    expect(formatTimes({ ...none, mornings: true, evenings: true }, tMock)).toBe(
      "Mornings, Evenings",
    )
  })

  it("shows the city with its radius, or just one of them", () => {
    expect(formatPlace({ ...none, cityName: "Brno", radiusKm: 15 }, tMock)).toBe(
      "Brno, within 15 km",
    )
    expect(formatPlace({ ...none, cityName: "Ostrava", radiusKm: 0 }, tMock)).toBe("Ostrava")
    expect(formatPlace({ ...none, radiusKm: 10 }, tMock)).toBe("within 10 km")
  })
})

describe("Profile route loader", () => {
  it("prefetches profile when session user exists", async () => {
    const mockEnsure = vi.fn().mockResolvedValue({ user: { id: "u-1" } })
    const mockPrefetch = vi.fn().mockResolvedValue(undefined)
    const context = {
      queryClient: {
        ensureQueryData: mockEnsure,
        prefetchQuery: mockPrefetch,
      },
    }

    const loader = (Route as unknown as { options: { loader: (args: unknown) => Promise<void> } })
      .options.loader
    await loader({ context })

    expect(mockEnsure).toHaveBeenCalledOnce()
    expect(mockPrefetch).toHaveBeenCalledOnce()
  })

  it("does not reject the loader when profile prefetch fails", async () => {
    const mockEnsure = vi.fn().mockResolvedValue({ user: { id: "u-1" } })
    const mockPrefetch = vi.fn().mockRejectedValue(new Error("Network failed"))
    const context = {
      queryClient: {
        ensureQueryData: mockEnsure,
        prefetchQuery: mockPrefetch,
      },
    }

    const loader = (Route as unknown as { options: { loader: (args: unknown) => Promise<void> } })
      .options.loader
    await expect(loader({ context })).resolves.toBeUndefined()
  })
})
