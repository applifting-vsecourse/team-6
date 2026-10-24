import { Fragment, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/errorMessage"

import { useMessages, useSendMessage } from "@/features/chat/hooks/useMessages"
import { useStickToBottom } from "@/features/chat/hooks/useStickToBottom"

import { DaySeparator } from "./DaySeparator"
import { MessageComposer } from "./MessageComposer"
import { MessageItem } from "./MessageItem"

type ChatPanelProps = {
  kvintetId: string
  currentUserId: string | undefined
}

const dayOf = (iso: string) => new Date(iso).toDateString()

export function ChatPanel({ kvintetId, currentUserId }: ChatPanelProps) {
  const { t } = useTranslation()
  const chat = useMessages(kvintetId)
  const send = useSendMessage(kvintetId)
  const { messages } = chat
  const scrollerRef = useRef<HTMLDivElement>(null)
  const scroll = useStickToBottom(scrollerRef, messages?.at(-1)?.id)

  const sendAndFollow = (body: string) => {
    // Mark the list as "at the bottom" first, so the refreshed list scrolls to our own message.
    scroll.scrollToBottom()
    return send.mutateAsync(body)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={scroll.onScroll}
          className="h-[60dvh] min-h-80 overflow-y-auto px-4 py-6 sm:px-6"
        >
          {chat.isLoading ? (
            <div
              className="flex flex-col gap-6"
              aria-busy="true"
            >
              <Skeleton className="h-16 w-2/3 rounded-lg" />
              <Skeleton className="ml-auto h-12 w-1/2 rounded-lg" />
              <Skeleton className="h-16 w-3/5 rounded-lg" />
            </div>
          ) : chat.isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-body text-muted-foreground">{t("chat.error")}</p>
              <Button
                variant="outline"
                onClick={() => void chat.refetch()}
              >
                {t("chat.retry")}
              </Button>
            </div>
          ) : messages?.length === 0 ? (
            <p className="flex h-full items-center justify-center text-center text-body text-muted-foreground">
              {t("chat.empty")}
            </p>
          ) : (
            <>
              {chat.hasEarlier && (
                <div className="mb-6 flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => chat.loadEarlier()}
                    disabled={chat.isLoadingEarlier}
                  >
                    {t("chat.showEarlier")}
                  </Button>
                  {chat.loadEarlierError ? (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {getErrorMessage(chat.loadEarlierError)}
                    </p>
                  ) : null}
                </div>
              )}
              <ul className="flex flex-col gap-5">
                {messages?.map((message, index) => {
                  const previous = messages[index - 1]
                  return (
                    <Fragment key={message.id}>
                      {(!previous || dayOf(previous.createdAt) !== dayOf(message.createdAt)) && (
                        <DaySeparator date={message.createdAt} />
                      )}
                      <MessageItem
                        message={message}
                        isOwn={message.authorId !== null && message.authorId === currentUserId}
                      />
                    </Fragment>
                  )
                })}
              </ul>
            </>
          )}
        </div>
        {scroll.hasNew && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border"
            onClick={scroll.scrollToBottom}
          >
            {t("chat.newMessages")}
          </Button>
        )}
      </div>
      <MessageComposer
        onSend={sendAndFollow}
        isSending={send.isPending}
        error={send.error}
      />
    </div>
  )
}
