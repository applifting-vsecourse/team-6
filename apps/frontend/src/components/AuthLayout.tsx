import type { ReactNode } from "react"

import { PageLayout } from "@/components/PageLayout"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  // App header slot, passed in so `components/` does not import from `features/auth`.
  header: ReactNode
  /** Right-hand column from `lg` up (sign-up preview). */
  aside?: ReactNode
  /** Small element beside the title, below `lg`, where the aside is hidden. */
  titleAccessory?: ReactNode
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
}: AuthLayoutProps) {
  return (
    <PageLayout header={header}>
      <section
        className={cn(
          "mx-auto w-full px-4 pt-16 pb-24",
          aside ? "max-w-6xl lg:flex lg:gap-16" : "max-w-lg",
        )}
      >
        <div className="mx-auto w-full max-w-lg lg:mx-0 lg:flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-title">{title}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{description}</p>
            </div>
            {titleAccessory ? <div className="shrink-0 lg:hidden">{titleAccessory}</div> : null}
          </div>

          <div className="mt-5">{children}</div>

          <p className="mt-5 text-sm text-muted-foreground">{footer}</p>
        </div>

        {aside ? <div className="hidden lg:block lg:flex-1">{aside}</div> : null}
      </section>
    </PageLayout>
  )
}
