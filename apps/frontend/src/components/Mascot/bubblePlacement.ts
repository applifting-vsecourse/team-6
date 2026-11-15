import type { BubbleLayout } from "./MascotBubble"
import type { MascotBubble } from "./MascotContext"

const MAX_WIDTH = 280
// In a slot the page reserved, the bubble may be as wide as the room allows, up to this.
const MAX_SLOT_WIDTH = 360
// Rough width of one character of the bubble text, and of the padding around it.
const CHAR_WIDTH = 9
const PADDING = 32
// Room for the Skip and Next buttons side by side.
const MIN_WIDTH_WITH_ACTIONS = 220
// Narrower than this a bubble beside the mascot is a column of single words.
const MIN_BESIDE_WIDTH = 200
const GUTTER = 16
const TAIL_ROOM = 14
const TAIL_INSET = 16
// The header is sticky and 64px tall at most: a mascot in it speaks downwards, into the page.
const HEADER_HEIGHT = 80
// A bubble above needs about this much room; closer to the top of the window it opens downwards.
const ABOVE_ROOM = 200

type Rect = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">
type Viewport = { width: number; height: number }

/** How wide the bubble wants to be: snug around a short line, wider for a longer one. */
export function preferredBubbleWidth(bubble: MascotBubble): number {
  const snug = Math.ceil(bubble.text.length * CHAR_WIDTH + PADDING)
  return bubble.actions?.length ? Math.max(snug, MIN_WIDTH_WITH_ACTIONS) : snug
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Where the bubble goes. With a `slot` (room a page set aside for it) it sits inside that room, so
 * it cannot cover anything. Without one it opens beside the mascot, on the side with most room.
 */
export function placeBubble(
  mascot: Rect,
  viewport: Viewport,
  options: { preferredWidth?: number; slot?: Rect | null; prefer?: "above" | "beside" } = {},
): BubbleLayout {
  const { preferredWidth = MAX_WIDTH, slot, prefer } = options
  const centerX = mascot.left + mascot.width / 2
  const centerY = mascot.top + mascot.height / 2
  const limit = slot ? Math.min(slot.width, MAX_SLOT_WIDTH) : MAX_WIDTH
  const maxWidth = Math.min(limit, viewport.width - GUTTER * 2)
  const width = Math.min(preferredWidth, maxWidth)

  // Centred on the mascot where it can be, so the tail points straight at it.
  const bounds = {
    min: Math.max(slot?.left ?? 0, GUTTER),
    max: Math.min(slot?.right ?? viewport.width, viewport.width - GUTTER) - width,
  }
  const centred = clamp(centerX - width / 2, bounds.min, Math.max(bounds.min, bounds.max))
  const tailX = clamp(centerX - centred, TAIL_INSET, width - TAIL_INSET)

  if (slot) {
    const slotCenterY = slot.top + slot.height / 2
    const side = slotCenterY < centerY ? "above" : "below"
    return side === "above"
      ? {
          side,
          width,
          maxWidth,
          left: centred,
          bottom: viewport.height - slot.bottom,
          tailX,
          tailY: 0,
        }
      : { side, width, maxWidth, left: centred, top: slot.top, tailX, tailY: 0 }
  }

  if (prefer === "above" && mascot.top >= ABOVE_ROOM) {
    return {
      side: "above",
      width,
      maxWidth,
      left: centred,
      bottom: viewport.height - mascot.top + TAIL_ROOM,
      tailX,
      tailY: 0,
    }
  }

  if (prefer === "beside") {
    // The mascot sits on something the person is working in: the bubble goes to its right and
    // takes the room there is, rather than cover it. A page with no room there shows no bubble.
    const room = viewport.width - mascot.right - TAIL_ROOM - GUTTER
    const narrowed = Math.max(Math.min(maxWidth, room), MIN_BESIDE_WIDTH)
    return {
      side: "right",
      width: Math.min(width, narrowed),
      maxWidth: narrowed,
      left: mascot.right + TAIL_ROOM,
      top: mascot.top,
      tailX,
      tailY: mascot.height / 2,
    }
  }

  const room = width + TAIL_ROOM + GUTTER
  if (mascot.top >= HEADER_HEIGHT && viewport.width - mascot.right >= room) {
    return {
      side: "right",
      width,
      maxWidth,
      left: mascot.right + TAIL_ROOM,
      top: mascot.top,
      tailX,
      tailY: mascot.height / 2,
    }
  }
  if (mascot.top >= HEADER_HEIGHT && mascot.left >= room) {
    return {
      side: "left",
      width,
      maxWidth,
      left: mascot.left - TAIL_ROOM - width,
      top: mascot.top,
      tailX,
      tailY: mascot.height / 2,
    }
  }
  if (mascot.top < ABOVE_ROOM) {
    return {
      side: "below",
      width,
      maxWidth,
      left: centred,
      top: mascot.bottom + TAIL_ROOM,
      tailX,
      tailY: 0,
    }
  }
  return {
    side: "above",
    width,
    maxWidth,
    left: centred,
    bottom: viewport.height - mascot.top + TAIL_ROOM,
    tailX,
    tailY: 0,
  }
}
