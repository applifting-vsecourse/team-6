import type { QueryClient } from "@tanstack/react-query"
import { redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { profileQueryOptions } from "@/features/profile/api/profileApi"

// `beforeLoad` for pages the server only serves to onboarded users (it answers 403 ONBOARDING_REQUIRED).
// Everyone else goes to Home, which tells them to finish their profile. A missing profile counts as
// unfinished; a failed fetch is not caught, so the route's error component shows it.
export const requireOnboarded = async ({ context }: { context: { queryClient: QueryClient } }) => {
  const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
  const profile = session
    ? await context.queryClient.ensureQueryData(profileQueryOptions(session.user.id))
    : null
  if (!profile?.onboardingCompletedAt) throw redirect({ to: ROUTES.overview, replace: true })
}
