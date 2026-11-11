import type { ReactNode } from "react"

import { PageLayout } from "@/components/PageLayout"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  title: string
  description?: string
  children: ReactNode
  footer: ReactNode
  // App header slot, passed in so `components/` does not import from `features/auth`.
  header: ReactNode
  /** Right-hand column from `lg` up (sign-up preview). */
  aside?: ReactNode
  /** Small element beside the title, below `lg`, where the aside is hidden. */
  titleAccessory?: ReactNode
  /** Below `lg`, under the title: room for something that must not cover the form (mascot bubble). */
  belowTitle?: ReactNode
}

/**
 * Sign-in / sign-up pages keep the app chrome — they are pages of this app,
 * not a separate island. No card: the form sits on the page like any content.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer,
  header,
  aside,
  titleAccessory,
  belowTitle,
}: AuthLayoutProps) {
  return (
    <PageLayout header={header}>
      <section
        className={cn(
          "mx-auto w-full px-4 pt-7 pb-10 md:pt-14 md:pb-22",
          aside ? "max-w-6xl lg:flex lg:gap-16" : "max-w-lg",
        )}
      >
        <div className="mx-auto w-full max-w-105 lg:mx-0 lg:flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-5 md:gap-2">
              <h1 className="text-h1-mobile md:text-h1">{title}</h1>
              {description ? (
                <p className="text-compact text-muted-foreground md:text-lead">{description}</p>
              ) : null}
            </div>
            {titleAccessory ? <div className="shrink-0 lg:hidden">{titleAccessory}</div> : null}
          </div>

          {belowTitle ? <div className="mt-4 lg:hidden">{belowTitle}</div> : null}

          <div className="mt-5 md:mt-4.5">{children}</div>

          <p className="mt-5 flex flex-wrap gap-x-1.5 text-small text-muted-foreground md:mt-4.5">
            {footer}
          </p>
        </div>

        {/* Sticky: the form is long, and the avatar beside it should stay in view while it is filled in.
          top-24 clears the 64px header. */}
        {aside ? (
          <div className="hidden lg:sticky lg:top-24 lg:block lg:flex-1 lg:self-start">{aside}</div>
        ) : null}
      </section>
    </PageLayout>
  )
}
