import { useTranslation } from "react-i18next"

const STEPS = [1, 2, 3, 4] as const

export function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
      <article className="mx-auto flex w-full max-w-180 flex-col gap-5 md:gap-7">
        <h1 className="text-h1-mobile md:text-h1">{t("howItWorks.title")}</h1>

        <ol className="flex flex-col gap-5 md:gap-7">
          {STEPS.map((n) => (
            <li
              key={n}
              className="flex items-start gap-4.5 rounded-lg border border-border bg-card p-5"
            >
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-h3"
              >
                {n}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-h3">{t(`howItWorks.step${n}Title`)}</h2>
                <p className="text-compact text-muted-foreground">{t(`howItWorks.step${n}Text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>
    </div>
  )
}
