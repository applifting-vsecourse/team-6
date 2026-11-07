import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { AppHeader } from "@/features/auth/components/AppHeader"
import { HowItWorksPage } from "@/features/kvintet/components/HowItWorksPage"

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksRoute,
})

function HowItWorksRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("howItWorks.seoTitle")} />
      <PageLayout header={<AppHeader />}>
        <HowItWorksPage />
      </PageLayout>
    </>
  )
}
