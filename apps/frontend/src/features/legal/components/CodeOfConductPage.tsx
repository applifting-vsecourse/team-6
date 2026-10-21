import { Trans, useTranslation } from "react-i18next"

import { SUPPORT_EMAIL } from "@/features/legal/constants"

const RULES = ["rule1", "rule2", "rule3", "rule4", "rule5"] as const
const REPORT_STEPS = ["reportStep1", "reportStep2", "reportStep3"] as const

export function CodeOfConductPage() {
  const { t } = useTranslation()

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-12 md:gap-8 md:pt-16 md:pb-24">
      <h1 className="text-title">{t("codeOfConduct.title")}</h1>
      <p className="text-lg text-body">{t("codeOfConduct.intro")}</p>

      <h2 className="text-heading">{t("codeOfConduct.rulesTitle")}</h2>
      <ol>
        {RULES.map((rule, index) => (
          <li
            key={rule}
            className="flex gap-3 border-t border-border py-3 first:border-t-0 md:gap-5"
          >
            <span className="font-mono text-xs leading-6 tracking-meta text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 text-foreground">{t(`codeOfConduct.${rule}`)}</span>
          </li>
        ))}
      </ol>

      <h2 className="text-heading">{t("codeOfConduct.reportTitle")}</h2>
      <p className="text-foreground">
        <Trans
          i18nKey="codeOfConduct.reportIntro"
          values={{ email: SUPPORT_EMAIL }}
          components={{
            email: (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold underline"
              >
                {SUPPORT_EMAIL}
              </a>
            ),
          }}
        />
      </p>
      <ul className="flex flex-col gap-2.5">
        {REPORT_STEPS.map((step) => (
          <li
            key={step}
            className="flex gap-3 text-body"
          >
            <span
              aria-hidden
              className="text-muted-foreground"
            >
              —
            </span>
            {t(`codeOfConduct.${step}`)}
          </li>
        ))}
      </ul>
    </article>
  )
}
