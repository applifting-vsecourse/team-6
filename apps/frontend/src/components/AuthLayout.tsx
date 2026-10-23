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
      <section className="mx-auto w-full max-w-lg px-4 pt-16 pb-24">
        <h1 className="text-title">{title}</h1>
        <p className="mt-2 text-lg text-body">{description}</p>

        <div className="mt-5">{children}</div>

        <p className="mt-5 text-sm text-body">{footer}</p>
      </section>
    </PageLayout>
  )
}
