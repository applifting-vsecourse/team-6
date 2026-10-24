import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ChatMessage } from "@/features/chat/api/chatApi"

import { ChatPanel } from "./ChatPanel"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
const { useGaze } = vi.hoisted(() => ({ useGaze: vi.fn(() => ({ ref: vi.fn() })) }))
vi.mock("@blobatar/react/gaze", () => ({ useGaze }))

type Params = Record<string, number>
const apiGet = vi.fn<(path: string, options: { searchParams: Params }) => Promise<ChatMessage[]>>()
const apiPost = vi.fn<(path: string, options: { json: { body: string } }) => Promise<ChatMessage>>()

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string, options: { searchParams: Params }) => ({
      json: () => apiGet(path, options),
    }),
    post: (path: string, options: { json: { body: string } }) => ({
      json: () => apiPost(path, options),
    }),
  },
}))

const message = (id: number, overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  kind: "USER",
  authorId: "u2",
  authorName: "Petr Svoboda",
  authorUsername: "petr",
  body: `Message ${id}`,
  createdAt: "2026-10-22T12:00:00.000Z",
  ...overrides,
})

const renderPanel = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatPanel currentUserId="u1" />
    </QueryClientProvider>,
  )
}

describe("ChatPanel", () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    useGaze.mockClear()
  })

  it("shows messages oldest to newest with author, time and a separator per day", async () => {
    apiGet.mockResolvedValue([
      message(1, { createdAt: "2026-10-21T12:00:00.000Z" }),
      message(2, { authorId: "u1", authorName: "Jana Nováková", authorUsername: "jana" }),
      message(3, { authorId: null, authorName: null, authorUsername: null }),
      message(4, { kind: "SYSTEM", authorId: null, authorName: null, body: "Eva left" }),
    ])

    renderPanel()

    const items = await screen.findAllByRole("listitem")
    // 2 day separators + 4 messages
    expect(items).toHaveLength(6)
    expect(screen.getByText(/October 21, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/October 22, 2026/)).toBeInTheDocument()
    expect(screen.getByText("Message 1")).toBeInTheDocument()
    expect(screen.getByText("Petr Svoboda")).toBeInTheDocument()
    // Own message is labelled "You", not by name
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.queryByText("Jana Nováková")).not.toBeInTheDocument()
    expect(screen.getByText("Deleted member")).toBeInTheDocument()
    expect(screen.getByText("Eva left")).toBeInTheDocument()
    expect(screen.getAllByText(/\d{1,2}:\d{2}/).length).toBeGreaterThanOrEqual(3)
    expect(apiGet).toHaveBeenCalledWith("kvintets/mine/messages", { searchParams: {} })
  })

  it("animates only the avatar under the mouse", async () => {
    apiGet.mockResolvedValue([message(1), message(2)])
    renderPanel()
    await screen.findByText("Message 1")
    // Static avatars do not even set up the gaze driver.
    expect(useGaze).not.toHaveBeenCalled()

    // The avatar itself is swapped on hover, so keep hold of its stable wrapper.
    const [first, second] = [...document.querySelectorAll('[data-slot="avatar"]')].map(
      (avatar) => avatar.parentElement!,
    )
    await userEvent.hover(first!)
    expect(useGaze).toHaveBeenCalledTimes(1)

    await userEvent.unhover(first!)
    useGaze.mockClear()
    await userEvent.hover(second!)
    expect(useGaze).toHaveBeenCalledTimes(1)
  })

  it("renders a message body as text, never as HTML", async () => {
    apiGet.mockResolvedValue([message(1, { body: "<img src=x onerror=alert(1)>" })])

    renderPanel()

    expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeInTheDocument()
    expect(document.querySelector("img[src='x']")).toBeNull()
  })

  it("explains an empty chat", async () => {
    apiGet.mockResolvedValue([])

    renderPanel()

    expect(await screen.findByText(/No messages yet/)).toBeInTheDocument()
  })

  it("shows an error with a way to retry, and recovers", async () => {
    apiGet.mockRejectedValueOnce(new Error("boom"))
    renderPanel()

    expect(await screen.findByText("We couldn't load the messages.")).toBeInTheDocument()

    apiGet.mockResolvedValue([message(1)])
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Message 1")).toBeInTheDocument()
  })

  it("sends with Enter, clears the box and picks the reply up with the next poll", async () => {
    apiGet.mockResolvedValueOnce([message(1)])
    renderPanel()
    await screen.findByText("Message 1")

    apiPost.mockResolvedValue(message(2, { authorId: "u1", body: "Thursday works" }))
    apiGet.mockResolvedValueOnce([message(2, { authorId: "u1", body: "Thursday works" })])
    const box = screen.getByRole("textbox", { name: "Message" })
    await userEvent.type(box, "Thursday works{Enter}")

    expect(apiPost).toHaveBeenCalledWith("kvintets/mine/messages", {
      json: { body: "Thursday works" },
    })
    expect(await screen.findByText("Thursday works")).toBeInTheDocument()
    // The refresh asked only for what came after the newest message we held
    expect(apiGet).toHaveBeenLastCalledWith("kvintets/mine/messages", {
      searchParams: { after: 1 },
    })
    expect(box).toHaveValue("")
  })

  it("keeps the text and shows the error when sending fails", async () => {
    apiGet.mockResolvedValue([])
    renderPanel()
    const box = await screen.findByRole("textbox", { name: "Message" })

    apiPost.mockRejectedValue(new Error("offline"))
    await userEvent.type(box, "Hello{Enter}")

    expect(await screen.findByRole("alert")).toHaveTextContent("An unexpected error occurred.")
    expect(box).toHaveValue("Hello")
  })

  it("keeps what was typed while a send is still in flight", async () => {
    apiGet.mockResolvedValue([])
    renderPanel()
    const box = await screen.findByRole("textbox", { name: "Message" })

    let finishSend: (sent: ChatMessage) => void = () => undefined
    apiPost.mockReturnValue(new Promise((resolve) => (finishSend = resolve)))
    await userEvent.type(box, "Hello{Enter}")
    await userEvent.type(box, " there")
    finishSend(message(1, { authorId: "u1", body: "Hello" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeEnabled())
    expect(box).toHaveValue("Hello there")
  })

  it("adds a line break on Shift+Enter instead of sending", async () => {
    apiGet.mockResolvedValue([])
    renderPanel()
    const box = await screen.findByRole("textbox", { name: "Message" })

    await userEvent.type(box, "one{Shift>}{Enter}{/Shift}two")

    expect(apiPost).not.toHaveBeenCalled()
    expect(box).toHaveValue("one\ntwo")
  })

  it("does not send a blank message", async () => {
    apiGet.mockResolvedValue([])
    renderPanel()
    const box = await screen.findByRole("textbox", { name: "Message" })

    await userEvent.type(box, "   {Enter}")

    expect(apiPost).not.toHaveBeenCalled()
  })

  it("loads earlier messages above the current ones until a short page", async () => {
    const latest = Array.from({ length: 50 }, (_, i) => message(i + 21))
    apiGet.mockResolvedValueOnce(latest)
    renderPanel()
    await screen.findByText("Message 21")

    apiGet.mockResolvedValueOnce(Array.from({ length: 20 }, (_, i) => message(i + 1)))
    await userEvent.click(screen.getByRole("button", { name: "Show earlier messages" }))

    expect(await screen.findByText("Message 1")).toBeInTheDocument()
    expect(apiGet).toHaveBeenLastCalledWith("kvintets/mine/messages", {
      searchParams: { before: 21 },
    })
    const list = screen.getByRole("list")
    expect(within(list).getAllByText(/^Message \d+$/)[0]).toHaveTextContent("Message 1")
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Show earlier messages" })).toBeNull(),
    )
  })
})
