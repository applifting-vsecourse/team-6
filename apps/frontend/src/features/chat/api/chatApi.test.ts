import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MESSAGE_POLL_LIMIT, messagesQueryOptions, type ChatMessage } from "./chatApi"

const apiGet = vi.fn<(path: string, options: { searchParams: Record<string, number> }) => unknown>()

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string, options: { searchParams: Record<string, number> }) => ({
      json: () => Promise.resolve(apiGet(path, options)),
    }),
  },
}))

const message = (id: number): ChatMessage => ({
  id,
  kind: "USER",
  authorId: "u2",
  authorName: "Petr Svoboda",
  authorUsername: "petr",
  body: `Message ${id}`,
  createdAt: "2026-10-22T12:00:00.000Z",
})

const range = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => message(from + i))

describe("messagesQueryOptions", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    apiGet.mockReset()
    queryClient = new QueryClient()
  })

  // staleTime 0 makes the second fetch run the queryFn again, like a poll does.
  const poll = (kvintetId = "k1") =>
    queryClient.fetchQuery({ ...messagesQueryOptions(kvintetId), staleTime: 0 })

  it("remembers whether older messages may exist from the first page only", async () => {
    apiGet.mockReturnValueOnce(range(1, 50))
    expect((await poll()).hasEarlier).toBe(true)

    apiGet.mockReturnValueOnce([])
    expect((await poll()).hasEarlier).toBe(true)
  })

  it("never continues from the cached messages of another kvintet", async () => {
    apiGet.mockReturnValueOnce([message(1), message(2)])
    await poll("kvintet-a")

    apiGet.mockReturnValueOnce([message(7)])
    const { messages } = await poll("kvintet-b")

    // A fresh kvintet loads its latest page; it does not ask "after 2" and glue A's history on.
    expect(apiGet).toHaveBeenLastCalledWith("kvintets/mine/messages", { searchParams: {} })
    expect(messages.map((m) => m.id)).toEqual([7])
  })

  it("catches up over several pages until one is shorter than the limit", async () => {
    apiGet.mockReturnValueOnce([message(1)])
    await poll()

    apiGet
      .mockReturnValueOnce(range(2, MESSAGE_POLL_LIMIT))
      .mockReturnValueOnce(range(2 + MESSAGE_POLL_LIMIT, 3))
    const { messages } = await poll()

    expect(messages.map((m) => m.id)).toEqual(
      Array.from({ length: 1 + MESSAGE_POLL_LIMIT + 3 }, (_, i) => i + 1),
    )
    expect(apiGet).toHaveBeenNthCalledWith(2, "kvintets/mine/messages", {
      searchParams: { after: 1 },
    })
    expect(apiGet).toHaveBeenNthCalledWith(3, "kvintets/mine/messages", {
      searchParams: { after: 1 + MESSAGE_POLL_LIMIT },
    })
    expect(apiGet).toHaveBeenCalledTimes(3)
  })
})
