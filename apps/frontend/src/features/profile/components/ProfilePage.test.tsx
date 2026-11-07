import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HTTPError } from "ky"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProfileResponse } from "@/features/profile/api/profileApi"
import type { useProfile } from "@/features/profile/hooks/useProfile"

import { ProfilePage } from "./ProfilePage"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    className,
  }: {
    children?: ReactNode
    to: string
    search?: { step: number }
    className?: string
  }) => (
    <a
      href={search ? `${to}?step=${search.step}` : to}
      className={className}
    >
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

const mockUseProfile = vi.fn<() => ReturnType<typeof useProfile>>()

vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: () => mockUseProfile(),
}))

const defaultUser = {
  id: "u-1",
  name: "Jana Nováková",
  username: "jana.novakova",
}

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
  })

  it("renders large blobatar in the header with alt text / accessible title", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    const avatar = document.body.querySelector("[data-slot=avatar]")
    expect(avatar).toBeInTheDocument()
    // Accessible title per AC: standing alone so it gets alt text (blobatar={{ title: name }})
    expect(avatar?.querySelector("title")).toHaveTextContent("Jana Nováková")
  })

  it("renders user identity details and desktop hint", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByRole("heading", { name: "Jana Nováková" })).toBeInTheDocument()
    expect(screen.getByText(/@jana.novakova · Marketing specialist/)).toBeInTheDocument()
    expect(screen.getByText("New username, new blobatar.")).toBeInTheDocument()
  })

  it("renders teach, learn and interest tag sections with edit links to step 1", () => {
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

    // Edit buttons link to onboarding step 1
    const links = screen.getAllByRole("link", { name: "Edit" })
    expect(links.length).toBe(4) // 3 tags sections + 1 when & where
    expect(links[0]).toHaveAttribute("href", "/onboarding?step=1")
    expect(links[1]).toHaveAttribute("href", "/onboarding?step=1")
    expect(links[2]).toHaveAttribute("href", "/onboarding?step=1")
    expect(links[3]).toHaveAttribute("href", "/onboarding?step=2")
  })

  it("renders when and where formatted string", () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    render(<ProfilePage user={defaultUser} />)

    expect(screen.getByRole("heading", { name: "When and where" })).toBeInTheDocument()
    expect(
      screen.getByText(/Weekday evenings · Prague, within 10 km · every 14 days/i),
    ).toBeInTheDocument()
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
          meetingFrequency: null,
        },
      }),
    )

    render(<ProfilePage user={defaultUser} />)

    const emptyTags = screen.getAllByText("Nothing added yet")
    expect(emptyTags.length).toBe(3) // teach, learn, interests
    expect(screen.getByText("No preferences set yet")).toBeInTheDocument()
  })

  it("opens delete account dialog when clicking delete button", async () => {
    mockUseProfile.mockReturnValue(mockProfileData())

    const mockRenderDialog = vi.fn(
      ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) =>
        isOpen ? (
          <div role="dialog">
            <h2>Delete account dialog</h2>
            <button onClick={() => onOpenChange(false)}>Cancel</button>
          </div>
        ) : null,
    )

    render(
      <ProfilePage
        user={defaultUser}
        renderDeleteAccountDialog={mockRenderDialog}
      />,
    )

    const deleteSection = screen.getByRole("heading", { name: "Delete account" })
    expect(deleteSection).toBeInTheDocument()
    expect(screen.getByText("Removes everything. Can't be undone.")).toBeInTheDocument()

    const deleteButton = screen.getByRole("button", { name: "Delete account" })
    await userEvent.click(deleteButton)

    expect(mockRenderDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        avatarSeed: "jana.novakova",
      }),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("renders loading state when isLoading is true", () => {
    mockUseProfile.mockReturnValue(
      mockProfileData({
        profile: null,
        isLoading: true,
      }),
    )

    const { container } = render(<ProfilePage user={defaultUser} />)
    expect(container.querySelectorAll("[data-slot=skeleton]").length).toBeGreaterThan(0)
  })

  it("renders error state with retry button when isError is true", async () => {
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
    const retryBtn = screen.getByRole("button", { name: "Retry" })
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

  it("falls back to user id when username is an empty string", () => {
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
  })
})
