import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { SiteHeader } from "@/app/SiteHeader"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { PrivacyPage } from "@/features/legal/components/PrivacyPage"

// Public on purpose: it is linked from the sign-up form, before anyone has an account.
export const Route = createFileRoute("/privacy")({
  component: PrivacyRoute,
})

function PrivacyRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("privacy.title")} />
      <PageLayout header={<SiteHeader />}>
        <PrivacyPage />
      </PageLayout>
    </>
  )
}
