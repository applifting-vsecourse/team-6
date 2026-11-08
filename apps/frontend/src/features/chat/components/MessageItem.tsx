import { useTranslation } from "react-i18next"

import { HoverGazeBlobatar } from "@/components/HoverGazeBlobatar"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"

import { KVINTET_STARTED, type ChatMessage } from "@/features/chat/api/chatApi"

type MessageItemProps = {
  message: ChatMessage
  isOwn: boolean
}

// The author is gone (account deleted), so every such message shares one neutral face.
const DELETED_AUTHOR_SEED = "deleted-member"

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const { t } = useTranslation()
  if (message.kind === "SYSTEM") {
    // The body is a code; one we do not know yet is shown as it is rather than hidden.
    return (
      <li className="text-center text-small text-muted-foreground">
        {message.body === KVINTET_STARTED ? t("chat.system.kvintetStarted") : message.body}
      </li>
    )
  }

  const name = isOwn ? t("chat.you") : (message.authorName ?? t("chat.deletedMember"))
  // Same seed as everywhere else a person appears, or one person turns into two faces.
  const seed = message.authorUsername ?? message.authorId ?? DELETED_AUTHOR_SEED

  return (
    <li className={cn("flex items-end gap-2 md:gap-2.5", isOwn && "flex-row-reverse")}>
      {/* A chat has many avatars: static, and only the one under the mouse is animated. */}
      <HoverGazeBlobatar
        name={seed}
        className="size-7.5 md:size-9"
      />
      <div className={cn("flex max-w-xl min-w-0 flex-col gap-1", isOwn && "items-end")}>
        {/* Phone: one muted "Name · time" line. From md: bold name and a mono time. */}
        <p className="flex items-baseline gap-1.5 text-small text-muted-foreground md:gap-2 md:text-label">
          <span className="md:font-medium md:text-foreground">{name}</span>
          <span
            aria-hidden="true"
            className="md:hidden"
          >
            ·
          </span>
          <time
            dateTime={message.createdAt}
            className="md:font-mono md:text-meta md:tracking-meta md:uppercase"
          >
            {formatTime(message.createdAt)}
          </time>
        </p>
        {/* Plain text only: React escapes it, whitespace-pre-wrap keeps the author's line breaks. */}
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-compact break-words whitespace-pre-wrap text-foreground md:px-3.5 md:py-2.5",
            isOwn ? "bg-highlight-soft" : "bg-secondary",
          )}
        >
          {message.body}
        </p>
      </div>
    </li>
  )
}
