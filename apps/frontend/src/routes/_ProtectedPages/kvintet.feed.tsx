import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { KvintetFeedPage } from "@/features/kvintet/components/KvintetFeedPage"

// The filter lives in the URL so a filtered feed can be shared and survives a reload.
const feedSearchParamsSchema = z.object({
  category: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/_ProtectedPages/kvintet/feed")({
  component: KvintetFeedRoute,
  validateSearch: feedSearchParamsSchema,
})

function KvintetFeedRoute() {
  const { t } = useTranslation()
  const { category } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <>
      <Seo title={t("kvintet.title")} />
      <KvintetFeedPage
        category={category}
        onCategoryChange={(next) => void navigate({ search: { category: next } })}
      />
    </>
  )
}
