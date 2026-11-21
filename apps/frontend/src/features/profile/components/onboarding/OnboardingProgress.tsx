import { useTranslation } from "react-i18next"

import { progressOf, type OnboardingPageId } from "@/features/profile/lib/onboardingPages"

const GROUP_KEYS = {
  1: "onboarding.groups.profile",
  2: "onboarding.groups.when",
  3: "onboarding.groups.expectations",
} as const

/** The name of the step (a tick on the summary) and one bar per step, filling per question. */
export function OnboardingProgress({ page }: { page: OnboardingPageId }) {
  const { t } = useTranslation()
  const { step, position, fills } = progressOf(page)
  const overall = Math.round(((fills[0] + fills[1] + fills[2]) / 3) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-label text-muted-foreground uppercase">{t(GROUP_KEYS[step])}</p>
        {!position && (
          <p
            aria-hidden
            className="font-mono text-meta text-ok"
          >
            ✓
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={t(GROUP_KEYS[step])}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={overall}
        className="flex gap-1.5"
      >
        {fills.map((fill, index) => (
          <div
            key={index}
            className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-track"
          >
            <div
              className="h-full rounded-[3px] bg-highlight transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
