import type { ReactNode } from "react"

import { PageLayout } from "@/components/PageLayout"

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  // App header slot, passed in so `components/` does not import from `features/auth`.
  header: ReactNode
}

/**
 * Sign-in / sign-up pages keep the app chrome — they are pages of this app,
 * not a separate island. No card: the form sits on the page like any content.
 */
export function AuthLayout({ title, description, children, footer, header }: AuthLayoutProps) {
  return (
    <PageLayout header={header}>
      <section className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
        <div className="mx-auto w-full max-w-105">
          <div className="flex flex-col gap-5 md:gap-2">
            <h1 className="text-h1-mobile md:text-h1">{title}</h1>
            <p className="text-copy text-muted-foreground md:text-lead">{description}</p>
          </div>

          <div className="mt-5 md:mt-4.5">{children}</div>

          <p className="mt-5 flex flex-wrap gap-x-1.5 text-small text-muted-foreground md:mt-4.5">
            {footer}
          </p>
        </div>
      </section>
    </PageLayout>
  )
}
