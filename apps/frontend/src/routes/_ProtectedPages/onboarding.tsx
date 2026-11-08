import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard"
import { onboardingSearchSchema } from "@/features/profile/lib/onboardingSearch"

export const Route = createFileRoute("/_ProtectedPages/onboarding")({
  validateSearch: onboardingSearchSchema,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    await context.queryClient.ensureQueryData(profileQueryOptions(session?.user?.id))
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const { step } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <>
      <Seo title={t("onboarding.title")} />
      <div className="px-4 pt-7 pb-10 md:pt-12 md:pb-22">
        <div className="mx-auto w-full max-w-160">
          <OnboardingWizard
            userId={user?.id}
            // Same seed as the header: username, id when there is none. Never the e-mail.
            avatarSeed={user ? user.username || user.id : undefined}
            step={step}
            onStepChange={(next) => void navigate({ search: { step: next } })}
          />
        </div>
      </div>
    </>
  )
}
