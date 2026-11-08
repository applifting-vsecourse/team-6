import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HTTPError } from "ky"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetFeedPage } from "@/features/kvintet/components/KvintetFeedPage"
import type { Frequency } from "@/features/kvintet/lib/frequencies"

const navigate = vi.fn()

// The grey blobatars use the gaze driver, which needs browser APIs jsdom lacks.
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))
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

const commonAvailability = {
  weekdays: false,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: false,
}

const kvintet = (id: string, title: string, overrides: Partial<FeedKvintet> = {}): FeedKvintet => ({
  id,
  title,
  categories: ["software-development"],
  capacity: 5,
  memberCount: 1,
  meetingFrequency: null,
  commonAvailability,
  members: [{ position: "Accountant", teach: ["excel"], learn: [], interests: [] }],
  reasons: [],
  ...overrides,
})

const apiError = (status: number, code: string) =>
  Object.assign(
    new HTTPError(new Response(null, { status }), new Request("http://api.test"), {} as never),
    {
      data: { code },
    },
  )

// `api.get(path).json()` for the feed and the reference list; `feed` resolves to the items.
const serve = (feed: () => Promise<unknown>, isFallback = false) =>
  vi.mocked(api.get).mockImplementation(
    (path: unknown) =>
      ({
        json: () =>
          path === "reference"
            ? Promise.resolve(reference)
            : feed().then((items) => ({ items, fallback: isFallback })),
      }) as never,
  )

const onCategoryChange = vi.fn()
const onFrequencyChange = vi.fn()

const renderPage = (filters: { category?: string[]; frequency?: Frequency[] } = {}) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <KvintetFeedPage
        category={filters.category ?? []}
        frequency={filters.frequency ?? []}
        onCategoryChange={onCategoryChange}
        onFrequencyChange={onFrequencyChange}
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

    expect(screen.getByText("Looking for kvintets that suit you…")).toBeInTheDocument()
  })

  it("lists the open kvintets with their count", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python"), kvintet("k2", "Spanish")]))
    renderPage()

    expect(await screen.findByRole("heading", { name: "From Excel to Python" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByText("2 kvintets · best match first")).toBeInTheDocument()
    expect(screen.queryByText(/Nothing fits your profile closely/)).not.toBeInTheDocument()
  })

  it("says so when nothing fits closely and it lists every open kvintet instead", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]), true)
    renderPage()

    expect(
      await screen.findByText(
        "Nothing fits your profile closely yet, so here are all open kvintets, closest first.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "From Excel to Python" })).toBeInTheDocument()
  })

  it("shows an empty state that offers to start a kvintet", async () => {
    serve(() => Promise.resolve([]))
    renderPage()

    expect(await screen.findByText("Nothing here yet")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Start a kvintet" })).toHaveLength(2)
  })

  it("shows an error with a retry that loads the feed again", async () => {
    let attempts = 0
    serve(() => (attempts++ === 0 ? Promise.reject(new Error("boom")) : Promise.resolve([])))
    renderPage()

    expect(await screen.findByText("We couldn't load the kvintets")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Nothing here yet")).toBeInTheDocument()
  })

  it("sends someone who is already in a kvintet to Overview", async () => {
    serve(() => Promise.reject(apiError(409, "already_in_kvintet")))
    renderPage()

    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/overview", replace: true }))
    expect(toast.info).toHaveBeenCalledWith("You are already in a kvintet.")
    expect(screen.queryByText("We couldn't load the kvintets")).not.toBeInTheDocument()
  })

  it("joins a kvintet, confirms and leaves for Home", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    renderPage()

    await userEvent.click(await screen.findByRole("button", { name: "Join" }))

    expect(api.post).toHaveBeenCalledWith("kvintets/k1/members")
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/overview" }))
    expect(toast.success).toHaveBeenCalledWith("You joined the kvintet.")
  })

  it("explains when the kvintet filled up meanwhile", async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    vi.mocked(api.post).mockRejectedValue(apiError(409, "kvintet_not_open"))
    renderPage()

    await userEvent.click(await screen.findByRole("button", { name: "Join" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("This kvintet is full or has already started."),
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("filters", () => {
  const feed = () =>
    Promise.resolve([
      kvintet("k1", "Spanish", { categories: ["languages"], meetingFrequency: "WEEKLY" }),
      kvintet("k2", "Excel to Python", {
        categories: ["software-development", "business"],
        meetingFrequency: "BIWEEKLY",
      }),
      kvintet("k3", "Sketching", { categories: ["leisure"], meetingFrequency: null }),
    ])
  const titles = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)

  it("fetches the whole feed once, whatever the filters", async () => {
    serve(feed)
    renderPage({ category: ["languages"] })

    await screen.findByRole("heading", { name: "Spanish" })

    expect(vi.mocked(api.get).mock.calls.filter(([path]) => path === "kvintets/feed")).toEqual([
      ["kvintets/feed"],
    ])
  })

  it("shows everything without filters", async () => {
    serve(feed)
    renderPage()

    await screen.findByRole("heading", { name: "Spanish" })

    expect(titles()).toEqual(["Spanish", "Excel to Python", "Sketching"])
    expect(screen.getByText("3 kvintets · best match first")).toBeInTheDocument()
  })

  it("keeps kvintets with any of the picked categories", async () => {
    serve(feed)
    renderPage({ category: ["business", "leisure"] })

    await screen.findByRole("heading", { name: "Sketching" })

    expect(titles()).toEqual(["Excel to Python", "Sketching"])
    expect(screen.getByText("2 kvintets · best match first")).toBeInTheDocument()
  })

  it("keeps kvintets with any of the picked frequencies, and hides those without one", async () => {
    serve(feed)
    renderPage({ frequency: ["WEEKLY", "BIWEEKLY"] })

    await screen.findByRole("heading", { name: "Spanish" })

    expect(titles()).toEqual(["Spanish", "Excel to Python"])
  })

  it("needs both a category and a frequency to match", async () => {
    serve(feed)
    renderPage({ category: ["languages"], frequency: ["BIWEEKLY"] })

    expect(await screen.findByText("Nothing for these filters")).toBeInTheDocument()
  })

  it("ignores a category from the URL that does not exist", async () => {
    serve(feed)
    renderPage({ category: ["bogus"] })

    await screen.findByRole("heading", { name: "Spanish" })

    expect(titles()).toEqual(["Spanish", "Excel to Python", "Sketching"])
  })

  it("reports the picked chip and the picked frequency", async () => {
    serve(feed)
    renderPage({ category: ["languages"] })

    const topic = await screen.findByRole("group", { name: "Topic" })
    await userEvent.click(within(topic).getByRole("button", { name: "Business" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith(["languages", "business"])

    await userEvent.click(screen.getByRole("button", { name: "Once a month" }))
    expect(onFrequencyChange).toHaveBeenLastCalledWith(["MONTHLY"])
  })

  it("says so when the filters leave nothing, and clears both of them", async () => {
    serve(feed)
    renderPage({ category: ["leisure"], frequency: ["WEEKLY"] })

    expect(await screen.findByText("Nothing for these filters")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Clear filter" }))

    expect(onCategoryChange).toHaveBeenCalledWith([])
    expect(onFrequencyChange).toHaveBeenCalledWith([])
  })

  it("names the topic when one is picked and nothing is in it", async () => {
    serve(() => Promise.resolve([kvintet("k1", "Spanish", { categories: ["languages"] })]))
    renderPage({ category: ["leisure"] })

    expect(await screen.findByText("Nothing in Leisure")).toBeInTheDocument()
  })

  it("does not call an empty feed a filtered one", async () => {
    serve(() => Promise.resolve([]))
    renderPage({ category: ["languages"] })

    expect(await screen.findByText("Nothing here yet")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear filter" })).not.toBeInTheDocument()
  })
})

describe("starting a kvintet", () => {
  const openDialog = async () => {
    serve(() => Promise.resolve([kvintet("k1", "From Excel to Python")]))
    renderPage()
    await userEvent.click(await screen.findByRole("button", { name: "Start a kvintet" }))
    return screen.findByRole("dialog")
  }

  const pickCategory = async (name: string) => {
    await userEvent.click(screen.getByRole("combobox", { name: "Category" }))
    await userEvent.click(await screen.findByRole("option", { name }))
  }

  it("shows what is missing instead of disabling the button", async () => {
    const dialog = await openDialog()

    await userEvent.click(within(dialog).getByRole("button", { name: "Start a kvintet" }))

    expect(await screen.findByText("Enter a topic")).toBeInTheDocument()
    expect(screen.getByText("Choose a category")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("creates the kvintet and leaves for Home", async () => {
    const dialog = await openDialog()

    await userEvent.type(
      screen.getByLabelText("What do you want to talk about"),
      "  How to use AI in a small firm ",
    )
    await pickCategory("Business")
    await userEvent.click(within(dialog).getByRole("button", { name: "Start a kvintet" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: { title: "How to use AI in a small firm", categorySlugs: ["business"] },
      }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/overview" }))
    expect(toast.success).toHaveBeenCalledWith("Your kvintet is open. Others can join it now.")
  })

  it("shows the server's reason inside the dialog", async () => {
    const dialog = await openDialog()
    vi.mocked(api.post).mockRejectedValue(apiError(409, "already_in_kvintet"))

    await userEvent.type(screen.getByLabelText("What do you want to talk about"), "Topic")
    await pickCategory("Software development")
    await userEvent.click(within(dialog).getByRole("button", { name: "Start a kvintet" }))

    expect(await screen.findByText("You are already in a kvintet.")).toBeInTheDocument()
  })
})
