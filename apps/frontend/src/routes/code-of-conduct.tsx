import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { AppHeader } from "@/features/auth/components/AppHeader"
import { CodeOfConductPage } from "@/features/legal/components/CodeOfConductPage"

// Public on purpose: it is linked from the sign-up form, before anyone has an account.
export const Route = createFileRoute("/code-of-conduct")({
  component: CodeOfConductRoute,
})

function CodeOfConductRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("codeOfConduct.seoTitle")} />
      <PageLayout header={<AppHeader />}>
        <CodeOfConductPage />
      </PageLayout>
    </>
  )
}
