import { useTranslation } from "react-i18next"

import { StepBlobatar } from "@/components/StepBlobatar"

// The Figma frame (A5) shows a number instead of a face on step 4; that is a design mistake.
const STEPS = [
  { n: 1, seed: "jana" },
  { n: 2, seed: "petr" },
  { n: 3, seed: "eva" },
  { n: 4, seed: "ondrej" },
] as const

export function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
      <article className="mx-auto flex w-full max-w-180 flex-col gap-5 md:gap-7">
        <h1 className="text-h1-mobile md:text-h1">{t("howItWorks.title")}</h1>

        <ol className="flex flex-col gap-5 md:gap-7">
          {STEPS.map(({ n, seed }) => (
            <li
              key={n}
              className="flex items-start gap-4.5 rounded-lg border border-border bg-card p-5"
            >
              <StepBlobatar
                seed={seed}
                className="size-12 shrink-0"
              />
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
