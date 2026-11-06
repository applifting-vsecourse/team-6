import type { ComponentType, ReactNode } from "react"
import type * as ReactQuery from "@tanstack/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as ReactRouter from "@tanstack/react-router"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { Route } from "@/routes/_ProtectedPages/overview"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

type MockProfileData = {
  id: string
  userId: string
  position: string | null
  roles: string[]
  onboardingCompletedAt: string | null
  teaches: unknown[]
  learns: unknown[]
  interests: unknown[]
}

const mockProfile = vi.hoisted<{
  data: MockProfileData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}>(() => ({
  data: {
    id: "p1",
    userId: "u1",
    position: "Software Engineer",
    roles: ["backend-developer"],
    onboardingCompletedAt: "2026-10-20T10:00:00Z",
    teaches: [],
    learns: [],
    interests: [],
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}))

const mockMyKvintet = vi.hoisted(() => ({
  data: null as KvintetDetails | null,
  isLoading: false,
  isError: false,
  error: null as Error | null,
  refetch: vi.fn(),
  vote: vi.fn(),
  isVoting: false,
  leave: vi.fn(),
  isLeaving: false,
}))

const mockFeed = vi.hoisted(() => ({
  data: { items: [] as FeedKvintet[], fallback: false },
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null as Error | null,
  refetch: vi.fn(),
}))

type MockChatMessage = {
  id: number
  kind: "USER" | "SYSTEM"
  authorId: string | null
  authorName: string | null
  authorUsername: string | null
  body: string
  createdAt: string
}

const mockMessages = vi.hoisted(() => ({
  data: {
    messages: [] as MockChatMessage[],
    hasEarlier: false,
  },
  isLoading: false,
}))
const deleteAccountMutate = vi.fn()

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", name: "Jana Nováková", username: "jana" } }),
}))

vi.mock("@/features/kvintet/hooks/useMyKvintet", () => ({
  useMyKvintet: () => mockMyKvintet,
}))

vi.mock("@/lib/api-client", () => ({
  api: {
    post: vi.fn(() => ({
      json: vi.fn().mockResolvedValue({}),
    })),
  },
}))

vi.mock("@/features/account/hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({ mutate: deleteAccountMutate, isPending: false }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactQuery>()
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
      const key = queryKey[0]
      if (key === "profile") return mockProfile
      if (key === "kvintet" && queryKey[1] === "mine") return mockMyKvintet
      if (key === "kvintet" && queryKey[1] === "feed") return mockFeed
      if (key === "chat") return mockMessages
      return { data: undefined, isLoading: false, isError: false }
    },
  }
})

const renderWithClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>()
  return {
    ...actual,
    Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
  }
})

const OverviewPage = Route.options.component as ComponentType

describe("OverviewPage - 4 States and Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteAccountMutate.mockReset()
    mockProfile.data = {
      id: "p1",
      userId: "u1",
      position: "Software Engineer",
      roles: ["backend-developer"],
      onboardingCompletedAt: "2026-10-20T10:00:00Z",
      teaches: [],
      learns: [],
      interests: [],
    }
    mockProfile.isLoading = false
    mockProfile.isError = false
    mockMyKvintet.data = null
    mockMyKvintet.isLoading = false
    mockMyKvintet.isError = false
    mockFeed.data = { items: [], fallback: false }
    mockFeed.isLoading = false
    mockFeed.isError = false
    mockMessages.data = { messages: [], hasEarlier: false }
  })

  describe("State 1: Profile not finished", () => {
    it("renders 'Finish profile' action linking to onboarding without forced redirect", () => {
      mockProfile.data = {
        id: "p1",
        userId: "u1",
        position: null,
        roles: [],
        onboardingCompletedAt: null,
        teaches: [],
        learns: [],
        interests: [],
      }

      renderWithClient(<OverviewPage />)

      expect(screen.getByRole("heading", { name: /Finish your profile/i })).toBeInTheDocument()
      const finishLink = screen.getByRole("link", { name: "Finish profile" })
      expect(finishLink).toHaveAttribute("href", "/onboarding")
      // Primary button for finishing profile is the single action
      expect(screen.queryByRole("link", { name: "See all proposals" })).not.toBeInTheDocument()
    })
  })

  describe("State 2: No Kvintet", () => {
    it("shows best-matching proposals inline with Join button, See all and Start your own", async () => {
      mockFeed.data = {
        fallback: false,
        items: [
          {
            id: "k-1",
            title: "AI at work",
            categories: ["technology"],
            capacity: 5,
            memberCount: 3,
            meetingFrequency: "BIWEEKLY",
            members: [
              { position: "Dev", teach: [], learn: [], interests: [] },
              { position: "PM", teach: [], learn: [], interests: [] },
              { position: "Designer", teach: [], learn: [], interests: [] },
            ],
            reasons: [],
          },
          {
            id: "k-2",
            title: "Python for Data",
            categories: ["technology"],
            capacity: 5,
            memberCount: 2,
            meetingFrequency: "WEEKLY",
            members: [
              { position: "Analyst", teach: [], learn: [], interests: [] },
              { position: "Dev", teach: [], learn: [], interests: [] },
            ],
            reasons: [],
          },
        ],
      }

      renderWithClient(<OverviewPage />)

      expect(screen.getByText("AI at work")).toBeInTheDocument()
      expect(screen.getByText("Python for Data")).toBeInTheDocument()

      const joinButtons = screen.getAllByRole("button", { name: "Join" })
      expect(joinButtons).toHaveLength(2)

      expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute("href", "/kvintet/feed")
      expect(screen.getByRole("button", { name: "Start your own" })).toBeInTheDocument()

      // Joining works from overview without visiting feed
      const firstButton = joinButtons[0]
      if (!firstButton) throw new Error("Join button missing")
      await userEvent.click(firstButton)
      expect(api.post).toHaveBeenCalledWith("kvintets/k-1/members")
    })
  })

  describe("State 3: Forming Kvintet", () => {
    it("shows members, vote state ('3 OF 4 WANT TO START') and Vote button when user can vote", async () => {
      mockMyKvintet.data = {
        id: "k-forming",
        title: "AI at work – what really works",
        status: "FORMING",
        createdAt: "2026-10-25T10:00:00Z",
        activatedAt: null,
        commonPreferences: null,
        capacity: 5,
        openSeatsCount: 1,
        members: [
          {
            userId: "u1",
            name: "Jana",
            username: "jana",
            role: "Developer",
            teachTags: ["react"],
            learnTags: ["python"],
            interestTags: [],
            hasVoted: false,
            isCurrentUser: true,
          },
          {
            userId: "u2",
            name: "Petr",
            username: "petr",
            role: "Designer",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: false,
          },
          {
            userId: "u3",
            name: "Karel",
            username: "karel",
            role: "PM",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: false,
          },
          {
            userId: "u4",
            name: "Eva",
            username: "eva",
            role: "Marketing",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: false,
          },
        ],
        voteStatus: {
          canVote: true,
          userHasVoted: false,
          votedCount: 3,
          totalCount: 4,
        },
      }

      renderWithClient(<OverviewPage />)

      expect(screen.getByRole("heading", { name: /Your kvintet is forming/i })).toBeInTheDocument()
      expect(screen.getByText(/3 OF 4 WANT TO START/i)).toBeInTheDocument()

      const voteButton = screen.getByRole("button", { name: "Start now" })
      expect(voteButton).toBeInTheDocument()

      await userEvent.click(voteButton)
      expect(mockMyKvintet.vote).toHaveBeenCalled()
    })

    it("shows voted confirmation badge when user has already voted", () => {
      mockMyKvintet.data = {
        id: "k-forming",
        title: "AI at work",
        status: "FORMING",
        createdAt: "2026-10-25T10:00:00Z",
        activatedAt: null,
        commonPreferences: null,
        capacity: 5,
        openSeatsCount: 1,
        members: [
          {
            userId: "u1",
            name: "Jana",
            username: "jana",
            role: "Developer",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: true,
          },
        ],
        voteStatus: {
          canVote: true,
          userHasVoted: true,
          votedCount: 3,
          totalCount: 4,
        },
      }

      renderWithClient(<OverviewPage />)
      expect(screen.getByText(/✓ Voted/i)).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Start now" })).not.toBeInTheDocument()
    })
  })

  describe("State 4: Active Kvintet", () => {
    it("shows group blobatars and latest chat message with button opening chat directly", () => {
      mockMyKvintet.data = {
        id: "k-active",
        title: "AI at work – what really works",
        status: "ACTIVE",
        createdAt: "2026-10-20T10:00:00Z",
        activatedAt: "2026-10-22T12:00:00Z",
        commonPreferences: null,
        capacity: 5,
        openSeatsCount: 0,
        members: [
          {
            userId: "u1",
            name: "Jana",
            username: "jana",
            role: "Developer",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: true,
          },
          {
            userId: "u2",
            name: "Petr",
            username: "petr",
            role: "Designer",
            teachTags: [],
            learnTags: [],
            interestTags: [],
            hasVoted: true,
            isCurrentUser: false,
          },
        ],
        voteStatus: {
          canVote: false,
          userHasVoted: true,
          votedCount: 5,
          totalCount: 5,
        },
      }
      mockMessages.data = {
        messages: [
          {
            id: 1,
            kind: "USER",
            authorId: "u2",
            authorName: "Petr",
            authorUsername: "petr",
            body: "Looking forward to our first meeting!",
            createdAt: "2026-10-22T13:00:00Z",
          },
        ],
        hasEarlier: false,
      }

      renderWithClient(<OverviewPage />)

      expect(screen.getByRole("heading", { name: "Your kvintet" })).toBeInTheDocument()
      expect(screen.getByText("Looking forward to our first meeting!")).toBeInTheDocument()
      expect(screen.getAllByText("Petr").length).toBeGreaterThanOrEqual(1)

      const chatLink = screen.getByRole("link", { name: "Open chat" })
      expect(chatLink).toHaveAttribute("href", "/kvintet/messages")
    })
  })

  describe("Loading and Error states", () => {
    it("renders loading skeleton when profile is loading", () => {
      mockProfile.isLoading = true
      const { container } = renderWithClient(<OverviewPage />)
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    })

    it("renders error state with retry button when query fails", async () => {
      mockProfile.isError = true
      mockProfile.error = new Error("Failed to load")

      renderWithClient(<OverviewPage />)

      const retryBtn = screen.getByRole("button", { name: "Retry" })
      expect(retryBtn).toBeInTheDocument()

      await userEvent.click(retryBtn)
      expect(mockProfile.refetch).toHaveBeenCalled()
    })
  })

  it("opens delete account dialog from profile card and confirms deletion", async () => {
    renderWithClient(<OverviewPage />)

    const triggerButton = screen.getByRole("button", { name: "Delete account" })
    expect(triggerButton).toBeInTheDocument()

    fireEvent.click(triggerButton)

    expect(await screen.findByRole("heading", { name: "Delete account" })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete your account\?/i)).toBeInTheDocument()

    // Confirm button in dialog (the trigger button is aria-hidden while dialog is open)
    const confirmButton = screen.getByRole("button", { name: "Delete account" })
    fireEvent.click(confirmButton)

    expect(deleteAccountMutate).toHaveBeenCalledOnce()
  })
})
