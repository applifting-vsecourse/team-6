import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { OnboardingWizard } from "@/features/profile/components/OnboardingWizard"

// The step lives in the URL so the app header can show it and a reload keeps it.
// Anything that is not 1-3 starts at the first step.
const onboardingSearchSchema = z.object({
  step: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(1)
    .catch(1),
})

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
      <div className="mx-auto w-full max-w-[672px] px-4 py-8 md:py-16">
        <OnboardingWizard
          userId={user?.id}
          step={step}
          onStepChange={(next) => void navigate({ search: { step: next } })}
        />
      </div>
    </>
  )
}
