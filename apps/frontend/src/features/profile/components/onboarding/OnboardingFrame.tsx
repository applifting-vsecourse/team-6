import type { ReactNode } from "react"
import type { Expression } from "blobatar/expression"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { GuideAvatar } from "@/features/profile/components/onboarding/GuideAvatar"
import { OnboardingProgress } from "@/features/profile/components/onboarding/OnboardingProgress"
import type { OnboardingPageId } from "@/features/profile/lib/onboardingPages"

type OnboardingFrameProps = {
  page: OnboardingPageId
  /** The person's avatar seed. */
  seed?: string
  /** The question, in the avatar's bubble. */
  title: string
  /** What to know about it, under the question. */
  hint: string
  /** When the answer is missing: replaces the hint, in red, and next to Continue. Never a red frame. */
  error?: { hint: string; problem: string } | null
  expression?: Expression
  /** Changes whenever the avatar should shake its head once (an error was just shown). */
  shakeKey?: number
  /** Not on the first page. */
  onBack?: () => void
  onContinue: () => void
  continueLabel: string
  isSaving?: boolean
  /** A red sentence next to Continue that is not about the answer, e.g. saving failed. */
  saveError?: string | null
  children: ReactNode
}

/**
 * One page of the onboarding (Figma #126): progress, the avatar with its question in a bubble, the
 * answers right below, and Back / Continue under them. It is a form, so Enter continues.
 */
export function OnboardingFrame({
  page,
  seed,
  title,
  hint,
  error,
  expression,
  shakeKey,
  onBack,
  onContinue,
  continueLabel,
  isSaving = false,
  saveError,
  children,
}: OnboardingFrameProps) {
  const { t } = useTranslation()
  const problem = saveError ?? error?.problem

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
      className="flex flex-col gap-7"
    >
      <OnboardingProgress page={page} />

      <div className="flex items-start gap-4.5">
        <GuideAvatar
          seed={seed}
          expression={expression}
          shakeKey={shakeKey}
        />
        <div
          role="status"
          className="relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-[20px] bg-card px-6 py-5"
        >
          <span
            aria-hidden
            className="absolute top-8 -left-2 size-4 rotate-45 bg-card"
          />
          <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
          <p className={cn("text-compact", error ? "text-destructive" : "text-muted-foreground")}>
            {error?.hint ?? hint}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">{children}</div>

      <div className="flex items-center gap-3 pt-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="bg-card"
          >
            <ArrowLeft />
            {t("common.back")}
          </Button>
        ) : null}
        <p
          role={problem ? "alert" : undefined}
          className={cn(
            "min-w-0 flex-1 text-small",
            problem ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {problem ?? t("onboarding.footer")}
        </p>
        <Button
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : continueLabel}
        </Button>
      </div>
    </form>
  )
}
