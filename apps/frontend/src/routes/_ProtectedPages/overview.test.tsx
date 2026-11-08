import type { ComponentType, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as ReactRouter from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HTTPError } from "ky"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { Route } from "@/routes/_ProtectedPages/overview"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1", name: "Jana Nováková", username: "jana" } }),
}))

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const navigateMock = vi.fn()
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
    Navigate: ({ to }: { to: string }) => <p data-testid="navigate">{to}</p>,
  }
})

const apiError = (status: number, code: string) =>
  Object.assign(
    new HTTPError(new Response(null, { status }), new Request("http://api.test"), {} as never),
    {
      data: { code },
    },
  )

const createResponseMock = (data: unknown, status = 200) => {
  const textStr = data !== null && data !== undefined ? JSON.stringify(data) : ""
  return {
    status,
    text: () => Promise.resolve(textStr),
    json: () => Promise.resolve(data),
  }
}

const createErrorResponseMock = (error: Error) => {
  return {
    status: (error as { response?: { status: number } }).response?.status ?? 500,
    text: () => Promise.reject(error),
    json: () => Promise.reject(error),
  }
}

const commonAvailability = {
  weekdays: false,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: false,
}

const defaultProfile = {
  userId: "u1",
  position: "Software Engineer",
  roles: ["backend-developer"],
  expectations: [],
  meetingFrequency: null,
  weekdays: true,
  weekends: false,
  mornings: false,
  afternoons: true,
  evenings: false,
  cityId: null,
  cityName: null,
  radiusKm: null,
  note: null,
  onboardingCompletedAt: "2026-10-20T10:00:00Z" as string | null,
  teaches: [],
  learns: [],
  interests: [],
}

const renderWithClient = (ui: ReactNode, client?: QueryClient) => {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    queryClient,
  }
}

const OverviewPage = Route.options.component as ComponentType

describe("OverviewPage - 4 States, Lifecycle, Gating and Actions", () => {
  let profileData: typeof defaultProfile | null
  let myKvintetData: KvintetDetails | null
  let feedData: { items: FeedKvintet[]; fallback: boolean }
  let unreadCount: number
  let messagesData: {
    id: number
    kind: "USER" | "SYSTEM"
    authorId: string | null
    authorName: string | null
    authorUsername: string | null
    body: string
    createdAt: string
  }[]

  beforeEach(() => {
    vi.clearAllMocks()
    profileData = { ...defaultProfile }
    myKvintetData = null
    feedData = { items: [], fallback: false }
    messagesData = []
    unreadCount = 0

    vi.mocked(api.get).mockImplementation((path: unknown) => {
      const p = String(path)
      if (p.includes("me/profile")) {
        if (!profileData) return createResponseMock(null, 204) as never
        return createResponseMock(profileData, 200) as never
      }
      if (p.includes("kvintets/mine/messages/unread")) {
        return createResponseMock({ active: true, count: unreadCount }, 200) as never
      }
      if (p.includes("kvintets/mine/messages")) {
        return createResponseMock(messagesData, 200) as never
      }
      if (p.includes("kvintets/mine")) {
        if (!myKvintetData) return createErrorResponseMock(apiError(403, "forbidden")) as never
        return createResponseMock(myKvintetData, 200) as never
      }
      if (p.includes("kvintets/feed")) {
        return createResponseMock(feedData, 200) as never
      }
      return createResponseMock({}, 200) as never
    })

    vi.mocked(api.post).mockImplementation((path: unknown, options?: unknown) => {
      const p = String(path)
      if (p.includes("kvintets/mine/messages")) {
        const body = (options as { json?: { body: string } })?.json?.body ?? ""
        return createResponseMock({
          id: 100,
          kind: "USER",
          authorId: "u1",
          authorName: "Jana",
          authorUsername: "jana",
          body,
          createdAt: new Date().toISOString(),
        }) as never
      }
      if (p.includes("kvintets/mine/vote")) {
        return createResponseMock({
          ...myKvintetData,
          voteStatus: {
            canVote: false,
            userHasVoted: true,
            votedCount: (myKvintetData?.voteStatus.votedCount ?? 0) + 1,
            totalCount: myKvintetData?.voteStatus.totalCount ?? 4,
          },
          beginsSeen: true,
        }) as never
      }
      return createResponseMock({}) as never
    })

    vi.mocked(api.delete).mockImplementation(() => {
      myKvintetData = null
      return createResponseMock({ success: true }) as never
    })
  })

  describe("State 1: Profile not finished", () => {
    it("renders 'Finish profile' action linking to onboarding without forced redirect", async () => {
      profileData = {
        ...defaultProfile,
        onboardingCompletedAt: null,
      }

      renderWithClient(<OverviewPage />)

      expect(
        await screen.findByRole("heading", { name: /Finish your profile/i }),
      ).toBeInTheDocument()
      const finishLink = screen.getByRole("link", { name: "Finish profile" })
      expect(finishLink).toHaveAttribute("href", "/onboarding")
      expect(screen.queryByRole("link", { name: "See all proposals" })).not.toBeInTheDocument()

      // Feed query must be disabled for not-onboarded user
      expect(vi.mocked(api.get)).not.toHaveBeenCalledWith(
        expect.stringContaining("kvintets/feed"),
        expect.anything(),
      )
      // So must the kvintet query: the API answers 403 until the profile is finished
      expect(vi.mocked(api.get).mock.calls.map(([url]) => url)).not.toContain("kvintets/mine")
    })
  })

  describe("State 2: No Kvintet", () => {
    it("shows best-matching proposals inline with Join button, See all and Start your own", async () => {
      feedData = {
        fallback: false,
        items: [
          {
            id: "k-1",
            title: "AI at work",
            categories: ["software-development"],
            capacity: 5,
            memberCount: 3,
            meetingFrequency: "BIWEEKLY",
            commonAvailability,
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
            categories: ["data-ai"],
            capacity: 5,
            memberCount: 2,
            meetingFrequency: "WEEKLY",
            commonAvailability,
            members: [
              { position: "Analyst", teach: [], learn: [], interests: [] },
              { position: "Dev", teach: [], learn: [], interests: [] },
            ],
            reasons: [],
          },
        ],
      }

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("AI at work")).toBeInTheDocument()
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

    it("shows what every member shares and a labelled free seat on each card", async () => {
      feedData = {
        fallback: false,
        items: [
          {
            id: "k-1",
            title: "AI at work",
            categories: ["software-development", "business"],
            capacity: 5,
            memberCount: 2,
            meetingFrequency: "BIWEEKLY",
            commonAvailability: { ...commonAvailability, evenings: true, weekdays: true },
            members: [
              { position: "Dev", teach: [], learn: [], interests: [] },
              { position: "PM", teach: [], learn: [], interests: [] },
            ],
            reasons: [],
          },
        ],
      }

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("evenings · weekdays · every 14 days")).toBeInTheDocument()
      expect(screen.getByText("Software development")).toBeInTheDocument()
      expect(screen.getByText("Business")).toBeInTheDocument()
      expect(screen.getAllByText("Free")).toHaveLength(3)
    })

    it("handles join failure by showing error toast and invalidating the feed", async () => {
      feedData = {
        fallback: false,
        items: [
          {
            id: "k-fail",
            title: "Full Kvintet",
            categories: ["software-development"],
            capacity: 5,
            memberCount: 4,
            meetingFrequency: null,
            commonAvailability,
            members: [],
            reasons: [],
          },
        ],
      }

      vi.mocked(api.post).mockImplementationOnce(() => {
        throw apiError(409, "kvintet_not_open")
      })

      const { queryClient } = renderWithClient(<OverviewPage />)
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

      const joinBtn = await screen.findByRole("button", { name: "Join" })
      await userEvent.click(joinBtn)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: ["kvintet", "feed"] }),
        )
      })
    })

    it("displays empty feed state when no proposals match", async () => {
      feedData = { items: [], fallback: false }

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("No proposals available right now.")).toBeInTheDocument()
    })

    it("opens start kvintet dialog when clicking 'Start your own'", async () => {
      renderWithClient(<OverviewPage />)

      const startBtn = await screen.findByRole("button", { name: "Start your own" })
      await userEvent.click(startBtn)

      expect(await screen.findByRole("heading", { name: /Start a kvintet/i })).toBeInTheDocument()
    })
  })

  describe("State 3: Forming Kvintet", () => {
    const formingKvintet: KvintetDetails = {
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
      beginsSeen: true,
    }

    it("shows members, vote state ('3 OF 4 WANT TO START') and Vote button when user can vote", async () => {
      myKvintetData = formingKvintet

      renderWithClient(<OverviewPage />)

      expect(
        await screen.findByRole("heading", { name: /Your kvintet is forming/i }),
      ).toBeInTheDocument()
      expect(screen.getByText(/3 OF 4 WANT TO START/i)).toBeInTheDocument()

      const voteButton = screen.getByRole("button", { name: "Start now" })
      expect(voteButton).toBeInTheDocument()

      await userEvent.click(voteButton)
      expect(api.post).toHaveBeenCalledWith("kvintets/mine/vote")
    })

    it("shows when everyone can meet and what each member teaches and wants to learn", async () => {
      myKvintetData = {
        ...formingKvintet,
        commonPreferences: {
          city: null,
          meetingFrequency: "WEEKLY",
          weekdays: true,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: true,
        },
      }

      renderWithClient(<OverviewPage />)
      await screen.findByRole("heading", { name: /Your kvintet is forming/i })

      expect(screen.getByText("Times that suit everyone:").parentElement).toHaveTextContent(
        "Times that suit everyone: evenings · weekdays · every week",
      )
      expect(screen.getByText("Teaches").parentElement).toHaveTextContent(/Teaches\s*react/i)
      expect(screen.getByText("Wants to learn").parentElement).toHaveTextContent(
        /Wants to learn\s*python/i,
      )
    })

    it("names only you on hover while the kvintet forms, never the others", async () => {
      myKvintetData = {
        ...formingKvintet,
        members: formingKvintet.members.map((m) => (m.isCurrentUser ? m : { ...m, name: null })),
      }

      const { container } = renderWithClient(<OverviewPage />)
      await screen.findByRole("heading", { name: /Your kvintet is forming/i })

      const seats = container.querySelectorAll('[data-seat="member"]')
      expect(seats[1]?.querySelector("[tabindex]")).toBeNull()
      await userEvent.hover(seats[1]!.firstElementChild as HTMLElement)
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

      const own = seats[0]!.querySelector<HTMLElement>("[tabindex]")!
      await userEvent.hover(own)
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Jana")
    })

    it("draws only you in colour, the others grey, and writes (you) once", async () => {
      myKvintetData = formingKvintet

      const { container } = renderWithClient(<OverviewPage />)
      await screen.findByRole("heading", { name: /Your kvintet is forming/i })

      const ring = [...container.querySelectorAll('[data-seat="member"]')]
      const greyMembers = ring.filter((seat) => /ced4de/i.test(seat.innerHTML))
      expect(ring.length).toBeGreaterThan(1)
      expect(greyMembers).toHaveLength(ring.length - 1)
      expect(screen.getByText(/\(you\)/)).toBeInTheDocument()
      expect(screen.queryByText(/\(\(you\)\)/)).not.toBeInTheDocument()
    })

    it("shows waiting variant when there are fewer than 3 members", async () => {
      myKvintetData = {
        ...formingKvintet,
        members: formingKvintet.members.slice(0, 2),
        voteStatus: {
          canVote: false,
          userHasVoted: false,
          votedCount: 0,
          totalCount: 2,
        },
        beginsSeen: true,
      }

      renderWithClient(<OverviewPage />)

      expect(
        await screen.findByRole("heading", { name: "Waiting for more people" }),
      ).toBeInTheDocument()
      expect(
        screen.getByText("At three you can vote to start. You'll see it here."),
      ).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Start now" })).not.toBeInTheDocument()
    })

    it("shows voted confirmation badge when user has already voted", async () => {
      myKvintetData = {
        ...formingKvintet,
        voteStatus: {
          ...formingKvintet.voteStatus,
          userHasVoted: true,
        },
        beginsSeen: true,
      }

      renderWithClient(<OverviewPage />)
      expect(await screen.findByText(/✓ Voted/i)).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Start now" })).not.toBeInTheDocument()
    })

    it("allows leaving forming kvintet and shows post-leave notice in State 2", async () => {
      myKvintetData = formingKvintet

      renderWithClient(<OverviewPage />)

      // Two buttons, one per layout (beside "Who's here" on desktop, under the card on a phone);
      // jsdom applies no CSS, so both exist here.
      const [leaveButton] = await screen.findAllByRole("button", { name: "Leave kvintet" })
      if (!leaveButton) throw new Error("Leave button missing")
      await userEvent.click(leaveButton)

      // Dialog opens
      expect(
        await screen.findByRole("heading", { name: "Are you sure you want to leave?" }),
      ).toBeInTheDocument()

      // Confirm leaving inside the dialog
      const confirmButton = screen.getByRole("button", { name: "Leave" })
      await userEvent.click(confirmButton)

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith("kvintets/mine/membership")
      })

      // After leave, post-leave notice displays
      expect(
        await screen.findByText(/You left.*AI at work – what really works/i),
      ).toBeInTheDocument()
    })
  })

  describe("State 4: Active Kvintet", () => {
    const activeKvintet: KvintetDetails = {
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
      beginsSeen: true,
    }

    it("shows group blobatars and latest chat message with button opening chat directly", async () => {
      myKvintetData = activeKvintet
      messagesData = [
        {
          id: 1,
          kind: "USER",
          authorId: "u2",
          authorName: "Petr",
          authorUsername: "petr",
          body: "Looking forward to our first meeting!",
          createdAt: "2026-10-22T13:00:00Z",
        },
      ]

      renderWithClient(<OverviewPage />)

      expect(await screen.findByRole("heading", { name: "Your kvintet" })).toBeInTheDocument()
      expect(await screen.findByText("Looking forward to our first meeting!")).toBeInTheDocument()
      expect(screen.getAllByText("Petr").length).toBeGreaterThanOrEqual(1)

      const chatLink = screen.getByRole("link", { name: "Open chat" })
      expect(chatLink).toHaveAttribute("href", "/kvintet/messages")
    })

    it("lists the members with what they teach, and when everyone can meet", async () => {
      myKvintetData = {
        ...activeKvintet,
        commonPreferences: {
          city: null,
          meetingFrequency: "WEEKLY",
          weekdays: true,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: true,
        },
        members: activeKvintet.members.map((m) =>
          m.isCurrentUser ? { ...m, teachTags: ["react"], learnTags: ["python"] } : m,
        ),
      }

      renderWithClient(<OverviewPage />)

      expect(await screen.findByRole("heading", { name: "Members" })).toBeInTheDocument()
      expect(screen.getByText("Times that suit everyone:").parentElement).toHaveTextContent(
        "Times that suit everyone: evenings · weekdays · every week",
      )
      expect(screen.getByText("Teaches").parentElement).toHaveTextContent(/Teaches\s*react/i)
      expect(screen.getByText("Wants to learn").parentElement).toHaveTextContent(
        /Wants to learn\s*python/i,
      )
    })

    it("names each member's blobatar on hover and shows their role next to the name", async () => {
      myKvintetData = activeKvintet

      const { container } = renderWithClient(<OverviewPage />)
      await screen.findByRole("heading", { name: "Members" })

      expect(screen.getByText(/· Designer/)).toBeInTheDocument()

      const seats = container.querySelectorAll('[data-seat="member"] > span')
      await userEvent.hover(seats[1] as HTMLElement)
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Petr")
    })

    it("counts the unread messages on the button that opens the chat", async () => {
      myKvintetData = activeKvintet
      unreadCount = 2

      renderWithClient(<OverviewPage />)

      expect(await screen.findByRole("link", { name: "Open chat (2 new)" })).toHaveAttribute(
        "href",
        "/kvintet/messages",
      )
    })

    it("writes plain 'Open chat' when nothing is unread", async () => {
      myKvintetData = activeKvintet

      renderWithClient(<OverviewPage />)

      expect(await screen.findByRole("link", { name: "Open chat" })).toBeInTheDocument()
    })

    it("previews the latest message from a member, never a system line", async () => {
      myKvintetData = activeKvintet
      messagesData = [
        {
          id: 1,
          kind: "USER",
          authorId: "u2",
          authorName: "Petr",
          authorUsername: "petr",
          body: "Looking forward to our first meeting!",
          createdAt: "2026-10-22T13:00:00Z",
        },
        {
          id: 2,
          kind: "SYSTEM",
          authorId: null,
          authorName: null,
          authorUsername: null,
          body: "kvintet_started",
          createdAt: "2026-10-22T14:00:00Z",
        },
      ]

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("Looking forward to our first meeting!")).toBeInTheDocument()
      expect(screen.queryByText("kvintet_started")).not.toBeInTheDocument()
    })

    it("shows the plain chat hint when the chat holds only system lines", async () => {
      myKvintetData = activeKvintet
      messagesData = [
        {
          id: 1,
          kind: "SYSTEM",
          authorId: null,
          authorName: null,
          authorUsername: null,
          body: "kvintet_started",
          createdAt: "2026-10-22T14:00:00Z",
        },
      ]

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("Plan your next meeting together.")).toBeInTheDocument()
      expect(screen.queryByText("kvintet_started")).not.toBeInTheDocument()
    })

    it("sends a member who has not seen the 'Kvintet begins' page there first", async () => {
      myKvintetData = { ...activeKvintet, beginsSeen: false }

      renderWithClient(<OverviewPage />)

      expect(await screen.findByTestId("navigate")).toHaveTextContent("/kvintet/begins")
      expect(screen.queryByRole("heading", { name: "Your kvintet" })).not.toBeInTheDocument()
    })

    it("sends icebreaker question to chat when clicking 'Send to chat'", async () => {
      myKvintetData = activeKvintet

      renderWithClient(<OverviewPage />)

      const sendBtn = await screen.findByRole("button", { name: "Send to chat" })
      await userEvent.click(sendBtn)

      expect(vi.mocked(api.post)).toHaveBeenCalled()
      const calls = vi.mocked(api.post).mock.calls
      const messageCall = calls.find(
        ([path]) => typeof path === "string" && path.includes("kvintets/mine/messages"),
      )
      expect(messageCall).toBeDefined()
      const options = messageCall?.[1] as { json?: { body?: string } } | undefined
      expect(options?.json?.body).toMatch(/What new thing did you learn at work this month\?/i)
      expect(toast.success).toHaveBeenCalledWith("Question sent to chat")
    })

    it("cycles through icebreaker questions when clicking 'Another question'", async () => {
      myKvintetData = activeKvintet

      renderWithClient(<OverviewPage />)

      expect(
        await screen.findByText(/What new thing did you learn at work this month\?/i),
      ).toBeInTheDocument()

      const anotherBtn = screen.getByRole("button", { name: "Another question" })
      await userEvent.click(anotherBtn)

      expect(
        screen.getByText(/What's a project or hobby you're currently excited about\?/i),
      ).toBeInTheDocument()
    })
  })

  describe("Loading and Error states", () => {
    const callsTo = (path: string) =>
      vi.mocked(api.get).mock.calls.filter(([url]) => (url as string).includes(path)).length
    const profileCalls = () => callsTo("me/profile")
    const kvintetCalls = () => callsTo("kvintets/mine")

    it("renders loading skeleton under the greeting while query is loading", () => {
      // Mock never-resolving promise
      vi.mocked(api.get).mockReturnValue(new Promise(() => undefined) as never)

      const { container } = renderWithClient(<OverviewPage />)

      expect(screen.getByRole("heading", { name: "Hi, Jana" })).toBeInTheDocument()
      expect(screen.getByRole("status")).toHaveTextContent("Getting your home ready…")
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    })

    it("renders error state with retry button when profile query fails", async () => {
      vi.mocked(api.get).mockImplementation((path: unknown) => {
        if (String(path).includes("me/profile")) {
          return createErrorResponseMock(new Error("Network failure")) as never
        }
        return createResponseMock({}) as never
      })

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("We couldn't load your home page")).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: "Hi, Jana" })).toBeInTheDocument()
      const before = profileCalls()

      // Retrying loads the profile again
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))
      await waitFor(() => expect(profileCalls()).toBeGreaterThan(before))
    })

    it("renders error state with retry button when myKvintet query fails with 500 error", async () => {
      vi.mocked(api.get).mockImplementation((path: unknown) => {
        const p = String(path)
        if (p.includes("me/profile")) {
          return createResponseMock(profileData, 200) as never
        }
        if (p.includes("kvintets/mine")) {
          return createErrorResponseMock(apiError(500, "internal_server_error")) as never
        }
        return createResponseMock({}) as never
      })

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("We couldn't load your home page")).toBeInTheDocument()
      const profileBefore = profileCalls()
      const kvintetBefore = kvintetCalls()

      // Only the query that failed is loaded again
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))
      await waitFor(() => expect(kvintetCalls()).toBeGreaterThan(kvintetBefore))
      expect(profileCalls()).toBe(profileBefore)
    })

    it("loads the profile again when it failed, without asking for a kvintet yet", async () => {
      vi.mocked(api.get).mockImplementation((path: unknown) => {
        const p = String(path)
        if (p.includes("me/profile")) {
          return createErrorResponseMock(apiError(500, "internal_server_error")) as never
        }
        return createResponseMock({}) as never
      })

      renderWithClient(<OverviewPage />)

      expect(await screen.findByText("We couldn't load your home page")).toBeInTheDocument()
      const profileBefore = profileCalls()

      await userEvent.click(screen.getByRole("button", { name: "Try again" }))
      await waitFor(() => expect(profileCalls()).toBeGreaterThan(profileBefore))
      // The API answers 403 for a kvintet until the profile is finished, so it is not asked.
      expect(kvintetCalls()).toBe(0)
    })
  })
})
