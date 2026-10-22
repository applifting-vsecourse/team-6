import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { KvintetFeedPage } from "@/features/kvintet/components/KvintetFeedPage"

export const Route = createFileRoute("/_ProtectedPages/kvintet/feed")({
  component: KvintetFeedRoute,
})

function KvintetFeedRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("kvintet.title")} />
      <KvintetFeedPage />
    </>
  )
}
