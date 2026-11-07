import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type OnboardingCardProps = ComponentProps<"section"> & {
  title?: string
  hint?: string
  // Marks a card whose answer is missing: the border turns red, the message sits inside.
  isInvalid?: boolean
}

/** One question of the onboarding: a white surface with a title, an optional hint and the answer. */
export function OnboardingCard({
  title,
  hint,
  isInvalid,
  className,
  children,
  ...props
}: OnboardingCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 md:p-5",
        isInvalid ? "border-destructive" : "border-border",
        className,
      )}
      {...props}
    >
      {title ? (
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h3">{title}</h2>
          {hint ? <p className="text-small text-muted-foreground">{hint}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
