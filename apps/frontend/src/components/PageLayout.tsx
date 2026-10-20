import type { ReactNode } from "react"

import { Footer } from "@/components/Footer"

type PageLayoutProps = {
  header: ReactNode
  children: ReactNode
}

/** App chrome shared by every page: header, content, footer. */
export function PageLayout({ header, children }: PageLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      {header}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
