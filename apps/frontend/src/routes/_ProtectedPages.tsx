import { createFileRoute, Outlet, redirect, useMatch } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { SiteHeader } from "@/app/SiteHeader"
import { NotFoundContent } from "@/components/Error/NotFound"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { encodeRedirectUri } from "@/features/auth/lib/redirect"
import { ONBOARDING_TOTAL_STEPS, pageOf } from "@/features/profile/lib/onboardingPages"

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
  // The onboarding page owns its step (in the URL); the header shows it.
  const onboarding = useMatch({ from: "/_ProtectedPages/onboarding", shouldThrow: false })

  return (
    <>
      <Seo />
      <PageLayout
        header={
          <SiteHeader
            onboardingStep={
              onboarding
                ? { current: pageOf(onboarding.search.page).step, total: ONBOARDING_TOTAL_STEPS }
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
