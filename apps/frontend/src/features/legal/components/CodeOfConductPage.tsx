import { Trans, useTranslation } from "react-i18next"

import { SUPPORT_EMAIL } from "@/config/support"

const RULES = ["rule1", "rule2", "rule3", "rule4", "rule5"] as const

export function CodeOfConductPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
      <article className="mx-auto flex w-full max-w-180 flex-col gap-5 md:gap-6">
        <header className="flex flex-col gap-5 md:gap-2">
          <h1 className="text-h1-mobile md:text-h1">{t("codeOfConduct.title")}</h1>
          <p className="text-copy text-muted-foreground md:text-lead">
            {t("codeOfConduct.subtitle")}
          </p>
        </header>

        <ol className="rounded-lg border border-border bg-card px-4 py-1 md:px-6 md:py-2">
          {RULES.map((rule, index) => (
            <li
              key={rule}
              className="flex gap-3 border-t border-border py-3 first:border-t-0 md:items-center md:gap-4.5 md:py-4"
            >
              <span className="font-mono text-meta tracking-meta text-highlight uppercase">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-copy text-foreground">{t(`codeOfConduct.${rule}`)}</span>
            </li>
          ))}
        </ol>

        <section className="flex flex-col gap-5 md:gap-2">
          <h2 className="text-h3">{t("codeOfConduct.reportTitle")}</h2>
          <p className="text-copy text-muted-foreground">
            <Trans
              i18nKey="codeOfConduct.reportIntro"
              values={{ email: SUPPORT_EMAIL }}
              components={{
                email: (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                ),
              }}
            />
          </p>
        </section>
      </article>
    </div>
  )
}
