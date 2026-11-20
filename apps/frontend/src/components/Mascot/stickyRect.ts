// Under the sticky header (64px at most), with a little air.
const STICKY_TOP = 72
// The size a `small` anchor shrinks to while it is stuck under the header.
const SMALL_SIZE = 40

export type MascotRect = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height"> & {
  /** Stuck under the header on a phone: there is no room for a bubble, so the mascot says nothing. */
  isQuiet: boolean
}

/**
 * Marks an anchor that stays under the header while its holder is on screen, instead of scrolling
 * away. With the value `small` it also shrinks there and falls quiet: for a phone, where a
 * full-size mascot would cover the form it rides over.
 */
export const STICKY_ATTRIBUTE = "data-mascot-sticky"
/** Marks the element a sticky anchor rides along; without one it is the anchor's parent. */
export const HOLDER_ATTRIBUTE = "data-mascot-holder"

/**
 * Where the mascot should stand for an anchor. A sticky anchor stays just under the header while
 * its holder (a tall card, a form) is on screen, and leaves with the holder's bottom edge. Other
 * anchors are taken as they are.
 */
export function stickyRect(element: HTMLElement): MascotRect {
  const rect = element.getBoundingClientRect()
  const mode = element.getAttribute(STICKY_ATTRIBUTE)
  const holder =
    mode === null ? null : (element.closest(`[${HOLDER_ATTRIBUTE}]`) ?? element.parentElement)
  if (!holder) {
    const { left, right, top, bottom, width, height } = rect
    return { left, right, top, bottom, width, height, isQuiet: false }
  }

  // How far the anchor has scrolled past the line it sticks to. A small one shrinks by that much,
  // so it glides down to its small size instead of snapping.
  const overshoot = Math.max(STICKY_TOP - rect.top, 0)
  const isSmall = mode === "small"
  const height = isSmall
    ? Math.max(rect.height - overshoot, Math.min(SMALL_SIZE, rect.height))
    : rect.height
  const width = rect.width * (height / rect.height)
  const top = Math.min(
    Math.max(rect.top, STICKY_TOP),
    holder.getBoundingClientRect().bottom - height,
  )
  return {
    // It shrinks towards its right edge, where a phone has the most room.
    left: rect.right - width,
    right: rect.right,
    width,
    height,
    top,
    bottom: top + height,
    isQuiet: isSmall && overshoot > 0,
  }
}
