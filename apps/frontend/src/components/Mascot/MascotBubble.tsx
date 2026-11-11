import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { MascotBubble as Bubble } from "./MascotContext"

/** Where the bubble is, in window coordinates, and which side of it points at the mascot. */
export type BubbleLayout = {
  /** Where the bubble sits relative to the mascot; its tail is on the edge facing it. */
  side: "right" | "left" | "above" | "below" | "dock"
  /** Width the bubble would like; its real width is measured, since text is only roughly sized. */
  width: number
  /** The most it may take; longer text wraps. */
  maxWidth: number
  left: number
  top?: number
  bottom?: number
  /** Above and below: where along the bubble its tail points, the middle of the mascot. */
  tailX: number
  /** Left and right: the same, from the top of the bubble. */
  tailY: number
}

const TAIL_CLASS: Record<BubbleLayout["side"], string> = {
  right: "-left-1.5 border-b border-l",
  left: "-right-1.5 border-t border-r",
  above: "-bottom-1.5 border-b border-r",
  below: "-top-1.5 border-t border-l",
  // Docked to the window, not to the mascot: nothing for a tail to point at.
  dock: "hidden",
}

/**
 * Speech bubble of the mascot. A floating thing, so it is the one place that keeps a shadow.
 * It waits until the mascot has arrived, so it never trails after it across the page.
 */
export function MascotBubble({
  bubble,
  layout,
  isVisible,
  onClose,
  onMeasure,
}: {
  bubble: Bubble
  layout: BubbleLayout
  isVisible: boolean
  /** Shows the close cross; it hides the bubble, nothing more. */
  onClose?: () => void
  /** The width the bubble really takes, so it can be centred and kept on screen exactly. */
  onMeasure: (width: number) => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const isInteractive = (bubble.actions?.length ?? 0) > 0 || onClose !== undefined

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => onMeasure(element.offsetWidth))
    observer.observe(element)
    return () => observer.disconnect()
  }, [onMeasure])

  const isVertical = layout.side === "above" || layout.side === "below"

  return (
    <motion.div
      ref={ref}
      role="status"
      className="fixed z-45 rounded-lg border border-border bg-card p-3.5 text-card-foreground shadow-md"
      style={{
        left: layout.left,
        top: layout.top,
        bottom: layout.bottom,
        // As wide as its text, up to the room it has: the text decides, not an estimate.
        width: "max-content",
        maxWidth: layout.maxWidth,
        // A bubble without buttons or a cross never takes a click, so it cannot get between a person and the page.
        pointerEvents: isVisible && isInteractive ? "auto" : "none",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span
        aria-hidden
        className={cn("absolute size-3 rotate-45 border-border bg-card", TAIL_CLASS[layout.side])}
        style={isVertical ? { left: layout.tailX - 6 } : { top: layout.tailY - 6 }}
      />
      <motion.div
        key={bubble.text}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        {/* The text wraps before the cross and starts at the cross's height. The cross reaches into
          the bubble's padding, so it takes as little of the line as it can. */}
        <div className="flex items-start gap-1">
          <p className="min-w-0 flex-1 text-compact">{bubble.text}</p>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t("tour.close")}
              onClick={onClose}
              className="-mt-1.5 -mr-1.5 shrink-0 text-muted-foreground"
            >
              <X />
            </Button>
          ) : null}
        </div>
        {bubble.actions?.length ? (
          <div className="flex flex-wrap justify-end gap-2">
            {bubble.actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant ?? "default"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  )
}
