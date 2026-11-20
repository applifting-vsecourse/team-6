import type { GazeTarget } from "blobatar/gaze"

// Far enough that the eyes go to the edge of their travel.
const DISTANCE = 600

/** How far the eyes may wander while they look away: well beyond the usual few units, so it shows. */
export const LOOK_AWAY_TRAVEL = 14

type Point = { x: number; y: number }

// Where the pointer was last seen. Not state: it moves all the time and nothing redraws for it; it
// is only read at the moment the eyes turn away.
let pointer: Point | null = null

/** Starts remembering where the pointer is. Returns the function that stops it. */
export function trackPointer(): () => void {
  const onMove = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY }
  }
  window.addEventListener("pointermove", onMove, { passive: true })
  return () => window.removeEventListener("pointermove", onMove)
}

/** For tests: forget (or set) where the pointer was. */
export function setPointerForTest(point: Point | null) {
  pointer = point
}

/**
 * A point for the eyes to look at while a password is typed: on the line from the pointer through
 * the mascot and well beyond it, so the mascot looks the other way from the cursor. Where the pointer
 * is not known, or sits on the mascot, it looks up and to the left.
 */
export function lookAwayFromPointer(
  left: number,
  top: number,
  width: number,
  height: number,
): GazeTarget {
  const mascot = { x: left + width / 2, y: top + height / 2 }
  const dx = pointer ? mascot.x - pointer.x : 0
  const dy = pointer ? mascot.y - pointer.y : 0
  const length = Math.hypot(dx, dy)

  if (!pointer || length < 1) return { x: mascot.x - DISTANCE, y: mascot.y - DISTANCE }
  return { x: mascot.x + (dx / length) * DISTANCE, y: mascot.y + (dy / length) * DISTANCE }
}
