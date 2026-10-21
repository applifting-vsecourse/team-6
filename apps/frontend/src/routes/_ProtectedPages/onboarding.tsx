import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard"

export const Route = createFileRoute("/_ProtectedPages/onboarding")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    await context.queryClient.ensureQueryData(profileQueryOptions(session?.user?.id))
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { t } = useTranslation()
  const { user } = useSession()

  return (
    <>
      <Seo title={t("onboarding.title")} />
      <div className="mx-auto w-full max-w-[672px] px-4 py-8 md:py-16">
        <OnboardingWizard userId={user?.id} />
      </div>
    </>
  )
}
