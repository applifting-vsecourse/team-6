import { useTranslation } from "react-i18next"

const STEPS = ["step1", "step2", "step3"] as const
const DETAILS = ["p1", "p2", "p3"] as const

export function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-12 md:gap-8 md:pt-16 md:pb-24">
      <h1 className="text-title">{t("howItWorks.title")}</h1>
      <p className="text-lg text-body">{t("howItWorks.intro")}</p>

      <h2 className="text-heading">{t("howItWorks.principlesTitle")}</h2>
      <ol>
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="flex flex-col gap-1 border-t border-border py-4 first:border-t-0 md:gap-2"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs leading-6 tracking-meta text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-subheading font-semibold text-foreground">
                {t(`howItWorks.${step}Title`)}
              </h3>
            </div>
            <p className="pl-7 text-body md:pl-9">{t(`howItWorks.${step}Text`)}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6">
        {DETAILS.map((detail) => (
          <p
            key={detail}
            className="text-sm text-foreground/80"
          >
            {t(`overview.howItWorks.${detail}`)}
          </p>
        ))}
      </div>
    </article>
  )
}
