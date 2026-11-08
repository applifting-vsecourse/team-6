import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { SiteHeader } from "@/app/SiteHeader"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { HowItWorksPage } from "@/features/legal/components/HowItWorksPage"

// Public on purpose: the footer links to it from the landing page, before anyone has an account.
export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksRoute,
})

function HowItWorksRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("howItWorks.seoTitle")} />
      <PageLayout header={<SiteHeader />}>
        <HowItWorksPage />
      </PageLayout>
    </>
  )
}
