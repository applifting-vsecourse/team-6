import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

// Placeholder: TanStack Router needs the _ProtectedPages layout to have at
// least one child, otherwise it collides with "/". Replace with the real page.
export const Route = createFileRoute("/_ProtectedPages/overview")({
  component: OverviewPage,
})

function OverviewPage() {
  return (
    <>
      <Seo title="Overview" />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      </div>
    </>
  )
}
