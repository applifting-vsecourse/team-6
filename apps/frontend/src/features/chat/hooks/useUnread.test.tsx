import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useMarkMessagesRead, useUnreadMessages } from "./useUnread"

const apiGet = vi.fn<(path: string) => unknown>()
const apiPost =
  vi.fn<(path: string, options: { json: { lastMessageId: number } }) => Promise<void>>()

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({ json: () => Promise.resolve(apiGet(path)) }),
    post: (path: string, options: { json: { lastMessageId: number } }) => apiPost(path, options),
  },
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state })
  document.dispatchEvent(new Event("visibilitychange"))
}

const READ_PATH = "kvintets/mine/messages/read"

describe("useMarkMessagesRead", () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue(undefined)
    setVisibility("visible")
  })
  afterEach(() => setVisibility("visible"))

  it("marks the newest message once, and again only for a newer one", async () => {
    const { rerender } = renderHook(({ id }) => useMarkMessagesRead(id), {
      wrapper,
      initialProps: { id: 5 },
    })

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(READ_PATH, { json: { lastMessageId: 5 } }),
    )

    rerender({ id: 5 })
    rerender({ id: 3 })
    expect(apiPost).toHaveBeenCalledTimes(1)

    rerender({ id: 8 })
    await waitFor(() =>
      expect(apiPost).toHaveBeenLastCalledWith(READ_PATH, { json: { lastMessageId: 8 } }),
    )
    expect(apiPost).toHaveBeenCalledTimes(2)
  })

  it("marks nothing while there are no messages", () => {
    renderHook(() => useMarkMessagesRead(undefined), { wrapper })

    expect(apiPost).not.toHaveBeenCalled()
  })

  it("marks nothing in a hidden tab, and marks once the tab becomes visible", async () => {
    setVisibility("hidden")
    renderHook(() => useMarkMessagesRead(7), { wrapper })

    expect(apiPost).not.toHaveBeenCalled()

    setVisibility("visible")

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(READ_PATH, { json: { lastMessageId: 7 } }),
    )
    expect(apiPost).toHaveBeenCalledTimes(1)
  })

  it("lets the next message try again after a failed mark", async () => {
    apiPost.mockRejectedValueOnce(new Error("boom"))
    const { rerender } = renderHook(({ id }) => useMarkMessagesRead(id), {
      wrapper,
      initialProps: { id: 4 },
    })
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1))

    // The failed mark must not count as done: a message with the same id is not skipped either.
    setVisibility("visible")
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2))
    expect(apiPost).toHaveBeenLastCalledWith(READ_PATH, { json: { lastMessageId: 4 } })

    rerender({ id: 6 })
    await waitFor(() =>
      expect(apiPost).toHaveBeenLastCalledWith(READ_PATH, { json: { lastMessageId: 6 } }),
    )
  })
})

describe("useUnreadMessages", () => {
  beforeEach(() => apiGet.mockReset())

  it("does not ask the server when disabled", () => {
    const { result } = renderHook(() => useUnreadMessages(false), { wrapper })

    expect(apiGet).not.toHaveBeenCalled()
    expect(result.current).toEqual({ isChatActive: false, unreadCount: 0 })
  })

  it("reports the count and that the chat is open", async () => {
    apiGet.mockReturnValue({ active: true, count: 3 })
    const { result } = renderHook(() => useUnreadMessages(true), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ isChatActive: true, unreadCount: 3 }))
    expect(apiGet).toHaveBeenCalledWith("kvintets/mine/messages/unread")
  })

  it("says the chat is not open while the kvintet is forming", async () => {
    apiGet.mockReturnValue({ active: false, count: 0 })
    const { result } = renderHook(() => useUnreadMessages(true), { wrapper })

    await waitFor(() => expect(apiGet).toHaveBeenCalled())
    expect(result.current).toEqual({ isChatActive: false, unreadCount: 0 })
  })
})
