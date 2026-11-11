// Under the sticky header (64px at most), with a little air.
const STICKY_TOP = 72

export type MascotRect = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">

/** Marks an anchor that rides along its parent while the parent is in view (`MascotCorner`). */
export const STICKY_ATTRIBUTE = "data-mascot-sticky"

/**
 * Where the mascot should stand for an anchor. A corner anchor sits on the top edge of its card,
 * and the card can be taller than the window: the mascot then stays just under the header while
 * the card is on screen, and leaves with the card's bottom edge. Other anchors are taken as they are.
 */
export function stickyRect(element: HTMLElement): MascotRect {
  const rect = element.getBoundingClientRect()
  const holder = element.hasAttribute(STICKY_ATTRIBUTE) ? element.parentElement : null
  if (!holder) return rect

  const top = Math.min(
    Math.max(rect.top, STICKY_TOP),
    holder.getBoundingClientRect().bottom - rect.height,
  )
  return {
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
    top,
    bottom: top + rect.height,
  }
}
