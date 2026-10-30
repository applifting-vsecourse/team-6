import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
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

const reference = {
  categories: [
    { slug: "software-development" },
    { slug: "business" },
    { slug: "languages" },
    { slug: "leisure" },
  ],
}

const kvintet = (id: string, title: string): FeedKvintet => ({
  id,
  title,
  categories: ["software-development"],
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

const onCategoryChange = vi.fn()

const renderPage = (category?: string) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <KvintetFeedPage
        category={category}
        onCategoryChange={onCategoryChange}
      />
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

describe("category filter", () => {
  const feedRequests = () =>
    vi.mocked(api.get).mock.calls.filter(([path]) => path === "kvintets/feed")

  it("offers every category after All, with All selected by default", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    renderPage()

    expect(await screen.findByRole("radio", { name: "All" })).toHaveAttribute("data-state", "on")
    expect(screen.getByRole("radio", { name: "Software development" })).toHaveAttribute(
      "data-state",
      "off",
    )
    expect(screen.getByRole("radio", { name: "Languages" })).toHaveAttribute("data-state", "off")
  })

  it("asks the server for the selected category", async () => {
    serve(() => Promise.resolve([kvintet("k1", "Spanish")]))
    renderPage("languages")

    expect(await screen.findByRole("heading", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Languages" })).toHaveAttribute("data-state", "on")
    expect(feedRequests()).toEqual([["kvintets/feed", { searchParams: { category: "languages" } }]])
  })

  it("reports the chosen chip, and undefined for All", async () => {
    serve(() => Promise.resolve([kvintet("k1", "Spanish")]))
    renderPage("languages")

    await userEvent.click(await screen.findByRole("radio", { name: "Software development" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith("software-development")

    await userEvent.click(screen.getByRole("radio", { name: "All" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith(undefined)
  })

  it("keeps the selection when the selected chip is pressed again", async () => {
    serve(() => Promise.resolve([kvintet("k1", "Spanish")]))
    renderPage("languages")

    await userEvent.click(await screen.findByRole("radio", { name: "Languages" }))

    expect(onCategoryChange).not.toHaveBeenCalled()
  })

  it("treats an unknown category from the URL as All and never sends it", async () => {
    serve(() => Promise.resolve([kvintet("k1", "Spanish")]))
    renderPage("bogus")

    expect(await screen.findByRole("heading", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("data-state", "on")
    expect(feedRequests()).toEqual([["kvintets/feed", { searchParams: undefined }]])
  })

  it("says so when nothing is in the category, and lets the user clear the filter", async () => {
    serve(() => Promise.resolve([]))
    renderPage("languages")

    expect(await screen.findByText("No proposals in Languages yet")).toBeInTheDocument()
    expect(screen.queryByText("Nothing fits?")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Clear filter" }))
    expect(onCategoryChange).toHaveBeenCalledWith(undefined)
  })

  it("starts a proposal in the filtered category from the empty state", async () => {
    serve(() => Promise.resolve([]))
    renderPage("languages")

    // The "nothing fits?" box is on screen while loading, so wait for the empty state first.
    await screen.findByText("No proposals in Languages yet")
    await userEvent.click(screen.getByRole("button", { name: "Start a new proposal" }))

    const dialog = await screen.findByRole("dialog")
    const group = within(dialog).getByRole("group", { name: "Categories" })
    expect(within(group).getByRole("button", { name: "Languages" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
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
    expect(screen.getByText("Choose a category")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("lets the user pick at most three categories", async () => {
    await openDialog()
    const group = screen.getByRole("group", { name: "Categories" })

    for (const name of ["Software development", "Business", "Languages"]) {
      await userEvent.click(within(group).getByRole("button", { name }))
    }

    expect(within(group).getByRole("button", { name: "Leisure" })).toBeDisabled()
    expect(within(group).getByRole("button", { name: "Software development" })).toBeEnabled()
  })

  it("creates the proposal and leaves for My kvintet", async () => {
    await openDialog()

    await userEvent.type(
      screen.getByLabelText("Topic or problem"),
      "  How to use AI in a small firm ",
    )
    const group = screen.getByRole("group", { name: "Categories" })
    await userEvent.click(within(group).getByRole("button", { name: "Software development" }))
    await userEvent.click(within(group).getByRole("button", { name: "Business" }))
    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: {
          title: "How to use AI in a small firm",
          categorySlugs: ["software-development", "business"],
        },
      }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/kvintet" }))
    expect(toast.success).toHaveBeenCalledWith("Your proposal is open. Others can join it now.")
  })

  it("shows the server's reason inside the dialog", async () => {
    await openDialog()
    vi.mocked(api.post).mockRejectedValue(apiError(409, "already_in_kvintet"))

    await userEvent.type(screen.getByLabelText("Topic or problem"), "Topic")
    await userEvent.click(
      within(screen.getByRole("group", { name: "Categories" })).getByRole("button", {
        name: "Software development",
      }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    expect(
      await screen.findByText("You are already in a proposal or a kvintet."),
    ).toBeInTheDocument()
  })
})
