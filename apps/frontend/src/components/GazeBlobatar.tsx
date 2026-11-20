import type { ComponentProps } from "react"
import { useGaze } from "@blobatar/react/gaze"
import type { Palette } from "blobatar"
import type { Expression } from "blobatar/expression"
import type { GazeTarget } from "blobatar/gaze"

import "blobatar/motion.css"
import "blobatar/gaze.css"

import { Blobatar } from "@/components/ui/blobatar"
import { cn } from "@/lib/utils"

type GazeBlobatarProps = {
  name: string
  /** Accessible label; leave out when the name is written next to the avatar. */
  title?: string
  className?: string
  /** "always" idles continuously (one big avatar); "hover" only while hovered (nav bar). */
  animate?: "always" | "hover"
  /** Eye excursion in viewBox units (the avatar is 100 across); keep it larger on small avatars. */
  travel?: number
  /** Colour override, e.g. the grey of an anonymous seat. */
  palette?: Palette
  /** A pose to hold while it idles and looks around, e.g. `happy`. */
  expression?: Expression
  /** What the eyes follow: the pointer by default, or a point (keep its identity stable). */
  lookAt?: GazeTarget
} & Pick<ComponentProps<typeof Blobatar>, "size">

/** Animated avatar whose eyes follow the cursor. Static `Blobatar` stays the default for lists. */
export function GazeBlobatar({
  name,
  title,
  className,
  animate = "always",
  travel = 3,
  palette,
  expression,
  lookAt = "pointer",
  size,
}: GazeBlobatarProps) {
  const { ref } = useGaze({ travel, lookAt })

  return (
    // overflow-visible: the eyes may cross the body outline on a hard glance.
    <Blobatar
      name={name}
      size={size}
      className={cn("overflow-visible", className)}
      blobatar={{ animate, ref, title, palette, expression }}
    />
  )
}
