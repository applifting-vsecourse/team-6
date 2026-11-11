import { useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { SiteHeader } from "@/app/SiteHeader"
import { CoreIdeaAnimation } from "@/components/CoreIdeaAnimation/CoreIdeaAnimation"
import { useMascotAnchor, useMascotStage } from "@/components/Mascot/MascotContext"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"
import { StepBlobatar } from "@/components/StepBlobatar"
import { Button } from "@/components/ui/button"

import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

// The phone design (M1) has shorter copy for the first two steps.
const STEPS = [
  { seed: "jana", n: 1, hasShort: true },
  { seed: "petr", n: 2, hasShort: true },
  { seed: "eva", n: 3, hasShort: false },
] as const

function LandingPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const [mascotAnchorRef] = useMascotAnchor("landing-cta")
  // The greeting would cover the sign-in button or the text above, so it speaks only while the
  // button or the mascot is pointed at (or focused), and never takes a click itself.
  const [isGreeting, setIsGreeting] = useState(false)
  // The yellow mascot greets visitors only; someone with an account has no use for it here.
  const stage = useMemo(
    () =>
      user
        ? null
        : {
            anchorId: "landing-cta",
            bubble: isGreeting
              ? { text: t("landing.mascot.getStarted"), prefer: "above" as const }
              : undefined,
          },
    [user, isGreeting, t],
  )
  useMascotStage(stage)

  return (
    <>
      <Seo />
      <PageLayout header={<SiteHeader />}>
        <div className="px-4">
          <div className="mx-auto flex w-full max-w-335 flex-col gap-5 pt-7 pb-10 md:gap-18 md:pt-18 md:pb-22">
            <section className="flex flex-col gap-8 xl:flex-row xl:items-center xl:gap-12">
              <div className="flex flex-col items-start gap-5 md:gap-5.5 xl:w-88 xl:shrink-0">
                <h1 className="text-display-mobile md:text-display">{t("landing.heroTitle2")}</h1>
                <p className="text-lead text-muted-foreground">
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
                      <div
                        className="relative"
                        onPointerEnter={() => setIsGreeting(true)}
                        onPointerLeave={() => setIsGreeting(false)}
                        onFocus={() => setIsGreeting(true)}
                        onBlur={() => setIsGreeting(false)}
                      >
                        <Button
                          asChild
                          className="w-full"
                        >
                          <Link to={ROUTES.signup}>{t("landing.createAccount")}</Link>
                        </Button>
                        {/* Where the mascot sits: on the corner of the button, like a sticker. */}
                        <span
                          ref={mascotAnchorRef}
                          aria-hidden
                          className="absolute -top-5 right-2 size-12 md:-right-5"
                        />
                      </div>
                      <Button
                        asChild
                        variant="outline"
                      >
                        <Link to={ROUTES.login}>{t("auth.signIn")}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative: the core idea in six scenes, with its own captions. Below the text on
                a phone and a narrow window; beside it, scaled down, on a wide one. */}
              <CoreIdeaAnimation className="xl:min-w-0 xl:flex-1" />
            </section>

            <section className="flex flex-col gap-4.5 border-t border-border pt-6 md:gap-7 md:pt-12">
              <h2 className="text-h2">{t("landing.howItWorks")}</h2>
              <ol className="flex flex-col gap-4.5 md:grid md:grid-cols-3 md:gap-10">
                {STEPS.map(({ seed, n, hasShort }) => (
                  <li
                    key={n}
                    className="flex flex-col items-start gap-1 md:gap-2"
                  >
                    <StepBlobatar
                      seed={seed}
                      className="size-10 md:size-12"
                    />
                    <h3 className="text-h3">{t(`landing.step${n}Title`)}</h3>
                    <p className="text-compact text-muted-foreground">
                      {hasShort ? (
                        <>
                          <span className="md:hidden">{t(`landing.step${n}TextShort`)}</span>
                          <span className="hidden md:inline">{t(`landing.step${n}Text`)}</span>
                        </>
                      ) : (
                        t(`landing.step${n}Text`)
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <p className="hidden gap-1.5 text-compact text-muted-foreground md:flex">
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
