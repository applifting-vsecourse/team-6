import { useCallback, useEffect, useRef, useState } from "react"
import { happy } from "blobatar/expression"
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Button } from "@/components/ui/button"

import { placeBubble, preferredBubbleWidth } from "./bubblePlacement"
import { MascotBubble, type BubbleLayout } from "./MascotBubble"
import { MASCOT_SEED, useMascotContext } from "./MascotContext"
import { stickyRect } from "./stickyRect"

const FLIGHT = { type: "spring", stiffness: 140, damping: 20, mass: 0.9 } as const
const CROSS_FADE = { duration: 0.35 } as const

/**
 * The one mascot of the app. It lives above the router, so it can fly from one page to another:
 * pages only declare an anchor, and it springs to the on-screen rectangle of that anchor.
 */
export function MascotOverlay() {
  const { t } = useTranslation()
  const context = useMascotContext()
  const shouldReduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const width = useMotionValue(0)
  const height = useMotionValue(0)
  const placed = useRef(false)
  const flight = useRef(0)
  const [layout, setLayout] = useState<BubbleLayout | null>(null)
  // The bubble waits for the mascot to land.
  const [isArrived, setIsArrived] = useState(false)
  // The text of the bubble that was closed with its cross; the same text stays closed.
  const [closedText, setClosedText] = useState<string | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(undefined)

  const stage = context?.stage ?? null
  const bubbleWidth = stage?.bubble ? preferredBubbleWidth(stage.bubble) : undefined
  const anchorId = stage?.anchorId
  const slotId = stage?.bubble?.slotId
  const prefer = stage?.bubble?.prefer
  const resolveAnchor = context?.resolveAnchor
  const subscribe = context?.subscribe

  /** `shouldFly`: spring to the anchor. Otherwise follow it at once, unless a flight is under way. */
  const follow = useCallback(
    (shouldFly: boolean) => {
      const element = anchorId ? resolveAnchor?.(anchorId) : null
      if (!element) return
      const rect = stickyRect(element)
      if (rect.width === 0) return

      const isInFlight = flight.current !== 0
      const isMoving =
        Math.abs(x.get() - rect.left) > 1 ||
        Math.abs(y.get() - rect.top) > 1 ||
        Math.abs(width.get() - rect.width) > 1
      if (
        !placed.current ||
        shouldReduceMotion ||
        (!shouldFly && !isInFlight) ||
        (!isMoving && !isInFlight)
      ) {
        flight.current = 0
        x.set(rect.left)
        y.set(rect.top)
        width.set(rect.width)
        height.set(rect.height)
        setIsArrived(true)
      } else {
        setIsArrived(false)
        const id = Math.max(1, flight.current + 1)
        flight.current = id
        void Promise.all([
          animate(x, rect.left, FLIGHT),
          animate(y, rect.top, FLIGHT),
          animate(width, rect.width, FLIGHT),
          animate(height, rect.height, FLIGHT),
        ]).then(() => {
          // A newer flight has taken over when the ids differ.
          if (flight.current !== id) return
          flight.current = 0
          setIsArrived(true)
        })
      }
      placed.current = true
      const slot = slotId ? resolveAnchor?.(slotId)?.getBoundingClientRect() : null
      setLayout(
        placeBubble(
          rect,
          { width: window.innerWidth, height: window.innerHeight },
          { preferredWidth: measuredWidth ?? bubbleWidth, slot, prefer },
        ),
      )
    },
    [
      anchorId,
      slotId,
      prefer,
      resolveAnchor,
      shouldReduceMotion,
      bubbleWidth,
      measuredWidth,
      x,
      y,
      width,
      height,
    ],
  )

  useEffect(() => {
    if (!anchorId) return
    // Deferred: the page may still be laying itself out, and an effect must not set state itself.
    const frame = requestAnimationFrame(() => follow(true))
    const onViewportChange = () => follow(false)
    window.addEventListener("scroll", onViewportChange, { passive: true })
    window.addEventListener("resize", onViewportChange)
    // A page may still be laying itself out when the anchor appears.
    const observer = new ResizeObserver(onViewportChange)
    observer.observe(document.body)
    const unsubscribe = subscribe?.(() => follow(true))
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onViewportChange)
      window.removeEventListener("resize", onViewportChange)
      observer.disconnect()
      unsubscribe?.()
    }
  }, [anchorId, follow, subscribe])

  const seed = stage?.seed
  const bubble = stage?.bubble
  const isClosed = bubble?.text === closedText

  return (
    <>
      <AnimatePresence
        onExitComplete={() => {
          // The next appearance starts on its anchor instead of flying in from where it left.
          placed.current = false
          flight.current = 0
        }}
      >
        {stage ? (
          <motion.div
            key="mascot"
            className="pointer-events-none fixed top-0 left-0 z-45"
            style={{ x, y, width, height }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Decorative: the bubble carries the words, so the face adds nothing for a screen reader. */}
            <div
              aria-hidden
              className="absolute inset-0"
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: seed ? 0 : 1, scale: seed ? 0.85 : 1 }}
                transition={CROSS_FADE}
              >
                <GazeBlobatar
                  name={MASCOT_SEED}
                  expression={happy}
                  className="size-full"
                />
              </motion.div>
              <AnimatePresence>
                {seed ? (
                  <motion.div
                    key={seed}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: [0.85, 1.08, 1] }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={CROSS_FADE}
                  >
                    <GazeBlobatar
                      name={seed}
                      className="size-full"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            {/* Once its bubble is closed the mascot is the way to bring it back. */}
            {isClosed ? (
              <Button
                variant="ghost"
                aria-label={t("tour.showHint")}
                onClick={() => setClosedText(null)}
                className="pointer-events-auto absolute inset-0 size-full rounded-full p-0 hover:bg-transparent"
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Not inside the mascot: that one moves with a transform, which would carry it along. */}
      <AnimatePresence>
        {bubble && layout && !isClosed ? (
          <MascotBubble
            key="bubble"
            bubble={bubble}
            layout={layout}
            isVisible={isArrived}
            onClose={bubble.isClosable ? () => setClosedText(bubble.text) : undefined}
            onMeasure={setMeasuredWidth}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
