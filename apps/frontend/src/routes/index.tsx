import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Header } from "@/components/Header/Header"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { HeaderMenu } from "@/features/auth/components/HeaderMenu"
import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const { t } = useTranslation()
  const { user } = useSession()

  return (
    <>
      <Seo title={t("landing.seoTitle")} />
      <Header userMenu={<HeaderMenu />} />
      <main className="min-h-svh">
        <section className="mx-auto w-full max-w-2xl px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Kvintet</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-muted-foreground">
            {t("landing.tagline")}
          </p>

          {/* The call to action depends on who is asking: no point offering an
              account to someone who already has one. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button
                asChild
                size="lg"
              >
                <Link to={ROUTES.overview}>{t("landing.openOverview")}</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                >
                  <Link to={ROUTES.signup}>{t("landing.createAccount")}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link to={ROUTES.login}>{t("auth.signIn")}</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
