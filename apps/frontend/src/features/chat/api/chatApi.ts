import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { chatKeys } from "./chatKeys"

// Mirror the backend: the latest page and the `before` page hold 50, a page after a cursor 100.
export const MESSAGE_PAGE_SIZE = 50
export const MESSAGE_POLL_LIMIT = 100
export const MESSAGE_MAX_LENGTH = 1000
const POLL_INTERVAL_MS = 5_000

export const messageSchema = z.object({
  id: z.number(),
  kind: z.enum(["USER", "SYSTEM"]),
  // Null for SYSTEM lines and for authors who deleted their account.
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  authorUsername: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
})

export type ChatMessage = z.infer<typeof messageSchema>

const messagesSchema = z.array(messageSchema)

const fetchMessages = async (searchParams: Record<string, number> = {}) =>
  messagesSchema.parse(await api.get("kvintets/mine/messages", { searchParams }).json<unknown>())

export const fetchEarlierMessages = (before: number) => fetchMessages({ before })

export const sendMessage = async (body: string) =>
  messageSchema.parse(await api.post("kvintets/mine/messages", { json: { body } }).json<unknown>())

export type MessagesData = {
  /** Oldest to newest. */
  messages: ChatMessage[]
  /** Whether the first page was full, i.e. older messages may exist. */
  hasEarlier: boolean
}

/**
 * The first run loads the latest page; every later run (poll, focus, after a send) asks only for
 * what came after the newest message we hold and appends it, repeating until a page comes back
 * shorter than the limit so `after=0` style catch-ups never stop halfway.
 */
export const messagesQueryOptions = (kvintetId: string) =>
  queryOptions({
    queryKey: chatKeys.messages(kvintetId),
    queryFn: async ({ client, queryKey }): Promise<MessagesData> => {
      const previous = client.getQueryData<MessagesData>(queryKey)
      if (!previous) {
        const messages = await fetchMessages()
        return { messages, hasEarlier: messages.length >= MESSAGE_PAGE_SIZE }
      }

      const messages = [...previous.messages]
      for (;;) {
        const page = await fetchMessages({ after: messages.at(-1)?.id ?? 0 })
        messages.push(...page)
        if (page.length < MESSAGE_POLL_LIMIT) break
      }
      return { messages, hasEarlier: previous.hasEarlier }
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })
