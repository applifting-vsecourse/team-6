import { useId, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type KvintetDescriptionProps = {
  text: string
  className?: string
}

export function KvintetDescription({ text, className }: KvintetDescriptionProps) {
  const { t } = useTranslation()
  const id = useId()
  const ref = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  // The toggle appears only when the clamp actually cuts text, which depends on the card's width.
  useLayoutEffect(() => {
    const paragraph = ref.current
    if (!paragraph || isExpanded) return
    const measure = () => setIsClamped(paragraph.scrollHeight > paragraph.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(paragraph)
    return () => observer.disconnect()
  }, [text, isExpanded])

  return (
    <div className={cn("flex min-w-0 flex-col items-start gap-1", className)}>
      <p
        id={id}
        ref={ref}
        // `wrap-anywhere`, not `wrap-break-word`: a long unbroken string must not widen the card.
        className={cn(
          "w-full text-small wrap-anywhere whitespace-pre-line text-body",
          !isExpanded && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {isClamped ? (
        <Button
          type="button"
          variant="link"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={() => setIsExpanded((isPrevExpanded) => !isPrevExpanded)}
          className="h-auto p-0 text-small font-semibold"
        >
          {isExpanded ? t("kvintet.description.showLess") : t("kvintet.description.showMore")}
        </Button>
      ) : null}
    </div>
  )
}
