import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react"

// How close to the end still counts as "reading the latest messages".
const BOTTOM_TOLERANCE_PX = 48

/**
 * Keeps the scrolling list in `scrollerRef` pinned to its newest entry, but never drags a reader
 * who scrolled up: then `hasNew` turns on so the UI can offer a jump button instead.
 */
export function useStickToBottom(
  scrollerRef: RefObject<HTMLDivElement | null>,
  lastId: number | undefined,
) {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNew, setHasNew] = useState(false)
  const seenId = useRef<number | undefined>(undefined)

  const scrollToBottom = useCallback(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
    setIsAtBottom(true)
    setHasNew(false)
  }, [scrollerRef])

  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const isNearBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= BOTTOM_TOLERANCE_PX
    setIsAtBottom(isNearBottom)
    if (isNearBottom) setHasNew(false)
  }, [scrollerRef])

  useLayoutEffect(() => {
    if (lastId === undefined || lastId === seenId.current) return
    const isFirst = seenId.current === undefined
    seenId.current = lastId
    if (isFirst || isAtBottom) scrollToBottom()
    else setHasNew(true)
  }, [lastId, isAtBottom, scrollToBottom])

  return { onScroll, hasNew, scrollToBottom }
}
