import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { OnboardingFlow } from "@/features/profile/components/onboarding/OnboardingFlow"
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
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <>
      <Seo title={t("onboarding.title")} />
      <div className="px-4 pt-5 pb-7 md:pt-12 md:pb-14">
        <div className="mx-auto w-full max-w-160">
          <OnboardingFlow
            userId={user?.id}
            // Same seed as the header: username, id when there is none. Never the e-mail.
            seed={user ? user.username || user.id : undefined}
            page={page}
            onPageChange={(next) => void navigate({ search: { page: next } })}
          />
        </div>
      </div>
    </>
  )
}
