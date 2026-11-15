import { cn } from "@/lib/utils"

import { useMascotAnchor } from "./MascotContext"
import { STICKY_ATTRIBUTE } from "./stickyRect"

/**
 * A spot on the corner of something (a card, a button) where the mascot can stick, like a sticker:
 * mostly outside it, so it sits on the card and not in it. The parent must be `relative`.
 * It is sticky: while the parent is on screen the mascot stays just under the header even if the
 * corner has scrolled out of sight, so a tall card keeps its mascot in view.
 * In a narrow window the mascot does not come here (see `OnboardingGuideBar`), so the spot stays
 * inside the card's edge there and adds no sideways scroll. It takes no clicks and says nothing
 * to a screen reader.
 */
export function MascotCorner({ id, className }: { id: string; className?: string }) {
  const [attach] = useMascotAnchor(id)

  return (
    <span
      ref={attach}
      aria-hidden
      {...{ [STICKY_ATTRIBUTE]: "" }}
      className={cn("pointer-events-none absolute -top-8 -right-1 size-14 md:-right-10", className)}
    />
  )
}
