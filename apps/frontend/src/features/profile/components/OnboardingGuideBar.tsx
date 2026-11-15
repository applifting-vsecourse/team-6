import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useMascotAnchor } from "@/components/Mascot/MascotContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { GUIDE_BAR_ID, type GuideBar } from "@/features/profile/hooks/useOnboardingGuide"

/**
 * The guide of a narrow window: the mascot and its tip in one bar that stays at the bottom of the
 * screen. It is the last thing in the step, so it takes its own room there and never covers the
 * button above it. A floating thing, hence the shadow.
 */
export function OnboardingGuideBar({ text, onNext }: GuideBar) {
  const { t } = useTranslation()
  const [attach] = useMascotAnchor(GUIDE_BAR_ID)
  // The tip that was closed with the cross. The next tip opens the bar again.
  const [closedText, setClosedText] = useState<string | null>(null)
  const isClosed = closedText === text

  return (
    <div
      className={cn(
        "sticky bottom-3 z-30 flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-md",
        // Closed, it is only the mascot: a tap on it brings the tip back.
        isClosed && "self-start rounded-full p-1.5",
      )}
    >
      {/* The mascot draws itself over this and takes no taps, so they land here. */}
      <Button
        ref={attach}
        type="button"
        variant="ghost"
        aria-label={t("tour.showHint")}
        disabled={!isClosed}
        onClick={() => setClosedText(null)}
        className="size-11 shrink-0 rounded-full p-0 hover:bg-transparent disabled:opacity-100"
      />
      {isClosed ? null : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p
              role="status"
              className="text-compact"
            >
              {text}
            </p>
            {onNext ? (
              <Button
                type="button"
                size="sm"
                onClick={onNext}
                className="self-end"
              >
                {t("tour.next")}
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("tour.close")}
            onClick={() => setClosedText(text)}
            className="-mt-1 -mr-1 shrink-0 text-muted-foreground"
          >
            <X />
          </Button>
        </>
      )}
    </div>
  )
}
