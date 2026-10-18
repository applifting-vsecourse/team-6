import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

// Placeholder so the post-sign-in redirect has a target; the onboarding story fills it in.
export const Route = createFileRoute("/_ProtectedPages/onboarding")({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("onboarding.title")} />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("onboarding.title")}</h1>
      </div>
    </>
  )
}
