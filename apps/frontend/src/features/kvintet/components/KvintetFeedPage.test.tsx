import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HTTPError } from "ky"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetFeedPage } from "@/features/kvintet/components/KvintetFeedPage"

const navigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }))

const reference = { categories: [{ slug: "technology" }, { slug: "languages" }] }

const kvintet = (id: string, title: string): FeedKvintet => ({
  id,
  title,
  category: "technology",
  capacity: 5,
  memberCount: 1,
  meetingFrequency: null,
  members: [{ position: "Accountant", teach: ["excel"], learn: [], interests: [] }],
})

const apiError = (status: number, code: string) =>
  Object.assign(
    new HTTPError(new Response(null, { status }), new Request("http://api.test"), {} as never),
    {
      data: { code },
    },
  )

// `api.get(path).json()` for the feed and the reference list.
const serve = (feed: () => Promise<unknown>) =>
  vi
    .mocked(api.get)
    .mockImplementation(
      (path: unknown) =>
        ({ json: () => (path === "reference" ? Promise.resolve(reference) : feed()) }) as never,
    )

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <KvintetFeedPage />
    </QueryClientProvider>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.post).mockResolvedValue(new Response(null, { status: 204 }) as never)
})

describe("KvintetFeedPage", () => {
  it("shows a loading state while the feed loads", () => {
    serve(() => new Promise(() => undefined))
    renderPage()

    expect(screen.getByText("Loading proposals…")).toBeInTheDocument()
  })

  it("lists the open proposals with their count", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python"), kvintet("k2", "Spanish")]))
    renderPage()

    expect(await screen.findByRole("heading", { name: "From Excel to Python" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByText("2 proposals")).toBeInTheDocument()
  })

  it("shows an empty state that offers to start a proposal", async () => {
    serve(() => Promise.resolve([]))
    renderPage()

    expect(await screen.findByText("No proposals for you yet")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Start a new proposal" })).toHaveLength(2)
  })

  it("shows an error with a retry that loads the feed again", async () => {
    let attempts = 0
    serve(() => (attempts++ === 0 ? Promise.reject(new Error("boom")) : Promise.resolve([])))
    renderPage()

    expect(await screen.findByText("Couldn't load proposals")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("No proposals for you yet")).toBeInTheDocument()
  })

  it("sends someone who is already in a proposal to Overview", async () => {
    serve(() => Promise.reject(apiError(409, "already_in_kvintet")))
    renderPage()

    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/overview", replace: true }))
    expect(toast.info).toHaveBeenCalledWith("You are already in a proposal.")
    expect(screen.queryByText("Couldn't load proposals")).not.toBeInTheDocument()
  })

  it("joins a proposal, confirms and leaves for My kvintet", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    renderPage()

    await userEvent.click(await screen.findByRole("button", { name: "Join this proposal" }))

    expect(api.post).toHaveBeenCalledWith("kvintets/k1/members")
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/kvintet" }))
    expect(toast.success).toHaveBeenCalledWith("You joined the proposal.")
  })

  it("explains when the proposal filled up meanwhile", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    vi.mocked(api.post).mockRejectedValue(apiError(409, "kvintet_not_open"))
    renderPage()

    await userEvent.click(await screen.findByRole("button", { name: "Join this proposal" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("This proposal is full or no longer open."),
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("starting a proposal", () => {
  const openDialog = async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    renderPage()
    await userEvent.click(await screen.findByRole("button", { name: "Start a new proposal" }))
    return screen.findByRole("dialog")
  }

  it("shows what is missing instead of disabling the button", async () => {
    await openDialog()

    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    expect(await screen.findByText("Enter a topic")).toBeInTheDocument()
    // The placeholder and the validation message share the text.
    expect(screen.getAllByText("Choose a category")).toHaveLength(2)
    expect(api.post).not.toHaveBeenCalled()
  })

  it("creates the proposal and leaves for My kvintet", async () => {
    await openDialog()

    await userEvent.type(
      screen.getByLabelText("Topic or problem"),
      "  How to use AI in a small firm ",
    )
    await userEvent.click(screen.getByRole("combobox", { name: "Category" }))
    await userEvent.click(await screen.findByRole("option", { name: "Technology" }))
    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: { title: "How to use AI in a small firm", categorySlug: "technology" },
      }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/kvintet" }))
    expect(toast.success).toHaveBeenCalledWith("Your proposal is open. Others can join it now.")
  })

  it("shows the server's reason inside the dialog", async () => {
    await openDialog()
    vi.mocked(api.post).mockRejectedValue(apiError(409, "already_in_kvintet"))

    await userEvent.type(screen.getByLabelText("Topic or problem"), "Topic")
    await userEvent.click(screen.getByRole("combobox", { name: "Category" }))
    await userEvent.click(await screen.findByRole("option", { name: "Technology" }))
    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    expect(
      await screen.findByText("You are already in a proposal or a kvintet."),
    ).toBeInTheDocument()
  })
})
