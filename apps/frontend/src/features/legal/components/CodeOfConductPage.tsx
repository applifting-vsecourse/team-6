import { useTranslation } from "react-i18next"

import { SUPPORT_EMAIL } from "@/features/legal/constants"

const RULES = ["rule1", "rule2", "rule3", "rule4", "rule5"] as const
const REPORT_STEPS = ["reportStep1", "reportStep2", "reportStep3"] as const

export function CodeOfConductPage() {
  const { t } = useTranslation()

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("codeOfConduct.title")}</h1>
      <p className="mt-4 text-base text-pretty">{t("codeOfConduct.intro")}</p>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">{t("codeOfConduct.rulesTitle")}</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6">
        {RULES.map((rule) => (
          <li key={rule}>{t(`codeOfConduct.${rule}`)}</li>
        ))}
      </ol>

      <h2 className="mt-8 text-xl font-semibold tracking-tight">
        {t("codeOfConduct.reportTitle")}
      </h2>
      <p className="mt-3">{t("codeOfConduct.reportIntro", { email: SUPPORT_EMAIL })}</p>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        {REPORT_STEPS.map((step) => (
          <li key={step}>{t(`codeOfConduct.${step}`)}</li>
        ))}
      </ul>
    </article>
  )
}
