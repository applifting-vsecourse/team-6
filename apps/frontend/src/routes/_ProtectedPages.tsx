import { createFileRoute, Outlet, redirect, useMatch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { NotFoundContent } from "@/components/Error/NotFound"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { AppHeader } from "@/features/auth/components/AppHeader"
import { encodeRedirectUri } from "@/features/auth/lib/redirect"
import { useUnreadMessages } from "@/features/chat/hooks/useUnread"
import { useKvintetMembership } from "@/features/kvintet/hooks/useKvintetMembership"
import { ONBOARDING_TOTAL_STEPS } from "@/features/profile/components/OnboardingWizard"

export const Route = createFileRoute("/_ProtectedPages")({
  loader: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session) return
    context.queryClient.clear()
    throw redirect({
      to: ROUTES.login,
      search: { from: encodeRedirectUri(location) },
    })
  },
  component: Layout,
  // Unknown URLs under this layout render in its outlet, which already has the header and footer.
  notFoundComponent: NotFoundContent,
})

function Layout() {
  const { t } = useTranslation()
  const { isMember } = useKvintetMembership()
  // Members can't browse other kvintets; say so instead of letting the page bounce them.
  const navDisabled = isMember ? { [ROUTES.kvintetFeed]: t("nav.kvintetFeedDisabled") } : undefined
  // Only members have a chat; the same poll says whether it has opened yet.
  const { isChatActive, unreadCount } = useUnreadMessages(isMember)
  // The onboarding page owns its step (in the URL); the header shows it.
  const onboarding = useMatch({ from: "/_ProtectedPages/onboarding", shouldThrow: false })

  return (
    <>
      <Seo />
      <PageLayout
        header={
          <AppHeader
            navDisabled={navDisabled}
            chat={isChatActive ? { unreadCount } : undefined}
            onboardingStep={
              onboarding
                ? { current: onboarding.search.step, total: ONBOARDING_TOTAL_STEPS }
                : undefined
            }
          />
        }
      >
        <Outlet />
      </PageLayout>
    </>
  )
}
