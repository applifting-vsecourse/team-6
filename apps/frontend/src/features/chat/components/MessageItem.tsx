import { useTranslation } from "react-i18next"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"

import type { ChatMessage } from "@/features/chat/api/chatApi"

type MessageItemProps = {
  message: ChatMessage
  isOwn: boolean
}

// The author is gone (account deleted), so every such message shares one neutral face.
const DELETED_AUTHOR_SEED = "deleted-member"

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const { t } = useTranslation()

  if (message.kind === "SYSTEM") {
    return <li className="text-center text-sm text-muted-foreground">{message.body}</li>
  }

  const name = isOwn ? t("chat.you") : (message.authorName ?? t("chat.deletedMember"))
  // Same seed as everywhere else a person appears, or one person turns into two faces.
  const seed = message.authorUsername ?? message.authorId ?? DELETED_AUTHOR_SEED

  return (
    <li className={cn("flex items-end gap-3", isOwn && "flex-row-reverse")}>
      <GazeBlobatar
        name={seed}
        animate="hover"
        travel={6}
        className="mb-0.5"
      />
      <div className={cn("flex max-w-xl min-w-0 flex-col gap-1", isOwn && "items-end")}>
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-semibold text-foreground">{name}</span>
          <time
            dateTime={message.createdAt}
            className="font-mono text-xs text-muted-foreground"
          >
            {formatTime(message.createdAt)}
          </time>
        </p>
        {/* Plain text only: React escapes it, whitespace-pre-wrap keeps the author's line breaks. */}
        <p
          className={cn(
            "rounded-lg border border-border px-3 py-2.5 text-base break-words whitespace-pre-wrap text-foreground",
            isOwn ? "bg-primary/10" : "bg-secondary",
          )}
        >
          {message.body}
        </p>
      </div>
    </li>
  )
}
