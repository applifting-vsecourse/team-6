import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { markMessagesRead, unreadQueryOptions } from "@/features/chat/api/chatApi"
import { chatKeys } from "@/features/chat/api/chatKeys"

/**
 * Unread count for the app header. Only members have a chat, so the caller says when to ask;
 * until the server answers (or while the kvintet is still forming) there is no chat to show.
 */
export function useUnreadMessages(isEnabled: boolean) {
  const { data } = useQuery({ ...unreadQueryOptions(), enabled: isEnabled })
  return { isChatActive: isEnabled && (data?.active ?? false), unreadCount: data?.count ?? 0 }
}

/**
 * Marks the chat as read up to the newest message on screen, whenever a newer one shows up
 * while the tab is visible (or the tab becomes visible with one waiting). A hidden tab has not
 * displayed anything, so it marks nothing.
 */
export function useMarkMessagesRead(newestId: number | undefined) {
  const queryClient = useQueryClient()
  const marked = useRef(0)
  const { mutate } = useMutation({
    mutationFn: markMessagesRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.unread() }),
    // Let the next new message try again instead of treating this one as done.
    onError: () => {
      marked.current = 0
    },
  })

  useEffect(() => {
    if (newestId === undefined) return
    const mark = () => {
      if (document.visibilityState !== "visible" || newestId <= marked.current) return
      marked.current = newestId
      mutate(newestId)
    }
    mark()
    document.addEventListener("visibilitychange", mark)
    return () => document.removeEventListener("visibilitychange", mark)
  }, [newestId, mutate])
}
