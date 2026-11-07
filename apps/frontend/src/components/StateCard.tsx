import type { ReactNode } from "react"

import { AnonymousBlobatar } from "@/components/AnonymousBlobatar"

// Opaque seats, so the faces say nothing about anyone.
const SEATS = ["seat-1", "seat-4", "seat-7"]

type StateCardProps = {
  title: string
  text: string
  /** Buttons; full width on a phone. */
  children?: ReactNode
}

/** An empty list: three grey blobatars, one sentence on what would appear, what to do next. */
export function StateCard({ title, text, children }: StateCardProps) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg border border-border bg-card px-4.5 py-7 text-center sm:px-8 sm:py-14">
      <div
        aria-hidden="true"
        className="flex -space-x-1.5"
      >
        {SEATS.map((seat) => (
          <AnonymousBlobatar
            key={seat}
            seed={seat}
            motion="always"
            className="size-14"
          />
        ))}
      </div>
      <h2 className="text-h2">{title}</h2>
      <p className="text-compact text-muted-foreground">{text}</p>
      {children ? (
        <div className="flex w-full flex-col items-center gap-3.5 max-sm:*:w-full sm:w-auto">
          {children}
        </div>
      ) : null}
    </div>
  )
}
