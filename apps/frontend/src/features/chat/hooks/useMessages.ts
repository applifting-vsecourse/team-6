import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  fetchEarlierMessages,
  MESSAGE_PAGE_SIZE,
  messagesQueryOptions,
  sendMessage,
  type ChatMessage,
} from "@/features/chat/api/chatApi"
import { chatKeys } from "@/features/chat/api/chatKeys"

/** The polled messages plus the older pages the reader asked for, oldest to newest. */
export function useMessages() {
  const query = useQuery(messagesQueryOptions())
  const [earlier, setEarlier] = useState<ChatMessage[]>([])
  const [isExhausted, setIsExhausted] = useState(false)

  const loadEarlier = useMutation({
    mutationFn: () => {
      const oldest = earlier[0] ?? query.data?.messages[0]
      return oldest ? fetchEarlierMessages(oldest.id) : Promise.resolve([])
    },
    onSuccess: (page) => {
      setEarlier((current) => [...page, ...current])
      setIsExhausted(page.length < MESSAGE_PAGE_SIZE)
    },
  })

  return {
    messages: query.data ? [...earlier, ...query.data.messages] : undefined,
    hasEarlier: !isExhausted && (query.data?.hasEarlier ?? false),
    loadEarlier: loadEarlier.mutate,
    isLoadingEarlier: loadEarlier.isPending,
    loadEarlierError: loadEarlier.error,
    // A failed poll with messages on screen is retried by the next poll, so only a
    // chat with nothing to show is an error state.
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    refetch: query.refetch,
  }
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendMessage,
    // Poll right away instead of appending the reply: another member's message with a lower id
    // may be newer than our cache, and appending ours would make the next poll skip it. The
    // mutation stays pending until the refresh lands, so the message is on screen when it clears.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.messages() }),
  })
}
