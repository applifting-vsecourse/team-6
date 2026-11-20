import { cn } from "@/lib/utils"

import { useMascotAnchor } from "./MascotContext"

/**
 * Room a page sets aside for the mascot's bubble. The bubble sits inside it, so it never covers
 * anything. Size it for the longest text the page shows.
 */
export function MascotBubbleSlot({ id, className }: { id: string; className?: string }) {
  const [attach] = useMascotAnchor(id)

  return (
    <div
      ref={attach}
      aria-hidden
      className={cn("pointer-events-none", className)}
    />
  )
}
