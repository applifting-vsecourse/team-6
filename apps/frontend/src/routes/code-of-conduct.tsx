import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Header } from "@/components/Header/Header"
import { Seo } from "@/components/Seo"

import { HeaderMenu } from "@/features/auth/components/HeaderMenu"
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
      <Header userMenu={<HeaderMenu />} />
      <main className="min-h-svh">
        <CodeOfConductPage />
      </main>
    </>
  )
}
