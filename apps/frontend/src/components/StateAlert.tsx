import type { ReactNode } from "react"

import { AnonymousBlobatar } from "@/components/AnonymousBlobatar"

type StateAlertProps = {
  title: string
  text: string
  /** The retry button. */
  children: ReactNode
  /** With a seed: a grey blobatar and a row on desktop. Without: a plain stack. */
  seed?: string
}

/** A list or page that failed to load: what happened, and a way to retry. */
export function StateAlert({ title, text, children, seed }: StateAlertProps) {
  return (
    <div
      role="alert"
      className={
        seed
          ? "flex flex-col gap-2.5 rounded-lg border border-destructive bg-destructive-soft p-4.5 sm:flex-row sm:items-center sm:gap-4 sm:p-6"
          : "flex flex-col items-start gap-2.5 rounded-lg border border-destructive bg-destructive-soft p-4.5 sm:p-6"
      }
    >
      {seed ? (
        <AnonymousBlobatar
          seed={seed}
          motion="always"
          className="size-12 shrink-0 max-sm:hidden"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-compact font-medium text-foreground">{title}</p>
        <p className="text-small text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  )
}
