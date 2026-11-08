import type { ReactNode } from "react"

import { AnonymousBlobatar } from "@/components/AnonymousBlobatar"

type ErrorLayoutProps = {
  /** Which grey blobatar to show; opaque, so it says nothing about anyone. */
  seed: string
  eyebrow?: string
  title: string
  description?: ReactNode
  action?: ReactNode
}

/** A whole-page state (404, crash): one big grey blobatar, what happened, what to do. */
export function ErrorLayout({ seed, eyebrow, title, description, action }: ErrorLayoutProps) {
  return (
    <div className="flex flex-col items-center gap-4.5 px-4 text-center">
      <AnonymousBlobatar
        seed={seed}
        motion="always"
        className="size-30"
      />
      {eyebrow ? (
        <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-h1-mobile md:text-h1">{title}</h1>
      {description ? (
        <p className="text-compact text-muted-foreground md:text-lead">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
