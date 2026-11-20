import { createFileRoute, Link } from "@tanstack/react-router"
import { Play } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { SiteHeader } from "@/app/SiteHeader"
import { CoreIdeaAnimation } from "@/components/CoreIdeaAnimation/CoreIdeaAnimation"
import { PageLayout } from "@/components/PageLayout"
import { PRODUCT_VIDEO_SOURCES, ProductVideo } from "@/components/ProductVideo/ProductVideo"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/lib/useMediaQuery"

import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const languages = Object.keys(PRODUCT_VIDEO_SOURCES)
    .map((code) => code.toUpperCase())
    .join(" / ")

  return (
    <>
      <Seo />
      <PageLayout header={<SiteHeader />}>
        <div className="px-4">
          <div className="mx-auto flex w-full max-w-300 flex-col gap-5 pt-7 pb-10 md:gap-18 md:pt-18 md:pb-22">
            <section className="flex flex-col gap-5 md:gap-8 xl:flex-row xl:items-center xl:justify-between xl:gap-16">
              <div className="flex flex-col items-start gap-5 md:gap-5.5 xl:max-w-159 xl:flex-1">
                <h1 className="text-h1-mobile md:text-display">
                  {t("landing.heroTitle1")}
                  <br />
                  {t("landing.heroTitle2")}
                </h1>
                <p className="text-compact text-muted-foreground md:text-lead">
                  <span className="md:hidden">{t("landing.heroTextShort")}</span>
                  <span className="hidden md:inline">{t("landing.heroText")}</span>
                </p>
                {/* The call to action depends on who is asking: no point offering an
                  account to someone who already has one. */}
                <div className="flex w-full flex-col gap-2.5 md:w-auto md:flex-row md:gap-3">
                  {user ? (
                    <Button asChild>
                      <Link to={ROUTES.overview}>{t("landing.goToOverview")}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild>
                        <Link to={ROUTES.signup}>{t("landing.createAccount")}</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                      >
                        <Link to={ROUTES.login}>{t("auth.signIn")}</Link>
                      </Button>
                    </>
                  )}
                </div>
                <a
                  href="#video"
                  onClick={(event) => {
                    event.preventDefault()
                    document
                      .getElementById("video")
                      ?.scrollIntoView({ behavior: isReducedMotion ? "auto" : "smooth" })
                  }}
                  className="inline-flex items-center gap-2 text-compact font-medium text-highlight underline max-md:hidden"
                >
                  <Play
                    aria-hidden="true"
                    className="size-2.5 fill-current"
                  />
                  {t("productVideo.watchLink")}
                </a>
              </div>

              {/* Decorative: the core idea in four scenes with clickable step tabs. Below the text
                on a phone and a narrow window; to its right, 500 px wide, on a wide one. */}
              <CoreIdeaAnimation className="max-md:pt-3 xl:w-125 xl:flex-none" />
            </section>

            <section
              id="video"
              className="flex scroll-mt-20 flex-col gap-3.5 max-md:pt-5 md:gap-6"
            >
              <div className="flex flex-col gap-3.5 md:flex-row md:items-end md:justify-between md:gap-4">
                <h2 className="text-h2">{t("productVideo.heading")}</h2>
                <p className="text-small text-muted-foreground">
                  {t("productVideo.meta", { languages })}
                </p>
              </div>
              <ProductVideo />
              {user ? null : (
                <Button
                  asChild
                  className="max-md:mt-1 max-md:w-full md:self-start"
                >
                  <Link to={ROUTES.signup}>{t("landing.createAccount")}</Link>
                </Button>
              )}
            </section>

            <p className="flex flex-col gap-0.5 text-compact text-muted-foreground md:flex-row md:gap-1.5">
              {t("landing.rulesLead")}
              <Link
                to={ROUTES.codeOfConduct}
                className="text-foreground underline"
              >
                {t("landing.rulesLink")}
              </Link>
            </p>
          </div>
        </div>
      </PageLayout>
    </>
  )
}
