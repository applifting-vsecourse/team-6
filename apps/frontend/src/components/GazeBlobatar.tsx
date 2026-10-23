import type { ComponentProps } from "react"
import { useGaze } from "@blobatar/react/gaze"

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
} & Pick<ComponentProps<typeof Blobatar>, "size">

/** Animated avatar whose eyes follow the cursor. Static `Blobatar` stays the default for lists. */
export function GazeBlobatar({
  name,
  title,
  className,
  animate = "always",
  travel = 3,
  size,
}: GazeBlobatarProps) {
  const { ref } = useGaze({ travel, lookAt: "pointer" })

  return (
    // overflow-visible: the eyes may cross the body outline on a hard glance.
    <Blobatar
      name={name}
      size={size}
      className={cn("overflow-visible", className)}
      blobatar={{ animate, ref, title }}
    />
  )
}
