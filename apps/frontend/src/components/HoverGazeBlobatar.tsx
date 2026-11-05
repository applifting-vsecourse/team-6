import { useState } from "react"
import type { Palette } from "blobatar"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Blobatar } from "@/components/ui/blobatar"
import { cn } from "@/lib/utils"

type HoverGazeBlobatarProps = {
  name: string
  className?: string
  palette?: Palette
  /** Eye excursion; keep it larger on small avatars. */
  travel?: number
}

/**
 * For avatars in a list: static until the mouse is over it, then animated and following the
 * pointer. Only the hovered one is animated, so a list of any length costs one gaze driver at a time.
 */
export function HoverGazeBlobatar({
  name,
  className = "size-8",
  palette,
  travel = 6,
}: HoverGazeBlobatarProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <span
      className={cn("block shrink-0", className)}
      onPointerEnter={(event) => setIsHovered(event.pointerType === "mouse")}
      onPointerLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <GazeBlobatar
          name={name}
          animate="hover"
          travel={travel}
          palette={palette}
          className="size-full"
        />
      ) : (
        <Blobatar
          name={name}
          className="size-full"
          blobatar={palette ? { palette } : undefined}
        />
      )}
    </span>
  )
}
