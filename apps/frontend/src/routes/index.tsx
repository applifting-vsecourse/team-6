import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { LogoMark } from "@/components/LogoMark"
import { PageLayout } from "@/components/PageLayout"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { AppHeader } from "@/features/auth/components/AppHeader"
import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

const STEPS = [
  {
    title: "Řekněte nám něco o sobě",
    text: "Vaše role, co umíte naučit a co se chcete naučit. Štítky, žádné fotky.",
  },
  {
    title: "Vyberte si návrh",
    text: "Uvidíte všechny skupiny, které k vám sedí – role a zájmy, jména zůstanou skrytá, dokud skupina nevznikne.",
  },
  {
    title: "Založte svůj kvintet",
    text: "S pěti členy vznikne sám. Se třemi nebo čtyřmi, když všichni hlasují pro. Pak se otevře skupinový chat.",
  },
]

function LandingPage() {
  const { t } = useTranslation()
  const { user } = useSession()

  return (
    <>
      <Seo />
      <PageLayout header={<AppHeader />}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-8 pb-12 md:pt-22 md:pb-24">
          <section className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-16">
            <LogoMark className="size-40 md:hidden" />
            <div className="flex flex-col items-start gap-5 md:flex-1">
              <h1 className="text-title md:text-display">
                Najděte si svůj <em>kvintet</em>.
              </h1>
              <p className="text-lg text-body">
                Kvintet posadí k jednomu stolu pět lidí, kteří se od sebe můžou něco naučit. Skupinu
                si vybíráte podle tématu, ne podle toho, koho už znáte.
              </p>
              {/* The call to action depends on who is asking: no point offering an
                  account to someone who already has one. */}
              <div className="flex w-full flex-col gap-2.5 md:w-auto md:flex-row md:gap-3">
                {user ? (
                  <Button asChild>
                    <Link to={ROUTES.overview}>Přejít na přehled</Link>
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
              <p className="text-sm text-muted-foreground">
                Žádné fotky, žádná hodnocení – jen lidé a témata.
              </p>
            </div>
            <LogoMark className="hidden size-75 shrink-0 md:block" />
          </section>

          <section className="flex flex-col gap-6 border-t border-border pt-10">
            <h2 className="text-heading">Jak to funguje</h2>
            <ol className="grid gap-5 md:grid-cols-3 md:gap-10">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-1 md:gap-2"
                >
                  <span className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-subheading">{step.title}</h3>
                  <p className="text-body">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </PageLayout>
    </>
  )
}
