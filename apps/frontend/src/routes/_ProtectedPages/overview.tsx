import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

// Placeholder: TanStack Router needs the _ProtectedPages layout to have at
// least one child, otherwise it collides with "/". Replace with the real page.
export const Route = createFileRoute("/_ProtectedPages/overview")({
  component: OverviewPage,
})

function OverviewPage() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("overview.title")}</h1>
      </div>
    </>
  )
}
