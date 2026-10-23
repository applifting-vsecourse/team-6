import { useState, type FormEvent, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"

import { MESSAGE_MAX_LENGTH } from "@/features/chat/api/chatApi"

// Show the counter only when the limit is near, so it does not nag.
const COUNTER_FROM = MESSAGE_MAX_LENGTH - 100

type MessageComposerProps = {
  /** Resolves once the message is on screen; a rejection keeps the text. */
  onSend: (body: string) => Promise<unknown>
  isSending: boolean
  error: unknown
}

export function MessageComposer({ onSend, isSending, error }: MessageComposerProps) {
  const { t } = useTranslation()
  const [text, setText] = useState("")

  const submit = async () => {
    if (isSending || !text.trim()) return
    try {
      await onSend(text)
      setText("")
    } catch {
      // The error is shown from `error`; the text stays so nothing typed is lost.
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: Enter confirms an IME candidate and must not send.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 border-t border-border bg-secondary p-3"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label
            htmlFor="chat-message"
            className="sr-only"
          >
            {t("chat.composer.label")}
          </Label>
          <Textarea
            id="chat-message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={1}
            placeholder={t("chat.composer.placeholder")}
            aria-invalid={error ? true : undefined}
            className="max-h-32 min-h-11 resize-none"
          />
        </div>
        <Button
          type="submit"
          disabled={isSending}
        >
          {isSending ? t("chat.composer.sending") : t("chat.composer.send")}
        </Button>
      </div>
      {text.length >= COUNTER_FROM && (
        <p className="text-right font-mono text-xs text-muted-foreground">
          {formatNumber(text.length)} / {formatNumber(MESSAGE_MAX_LENGTH)}
        </p>
      )}
      {error ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {getErrorMessage(error)}
        </p>
      ) : null}
    </form>
  )
}
