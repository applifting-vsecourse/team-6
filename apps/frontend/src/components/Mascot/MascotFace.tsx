import { useEffect } from "react"
import type { Palette } from "blobatar"
import type { Expression } from "blobatar/expression"
import type { GazeTarget } from "blobatar/gaze"
import { useAnimate, useReducedMotion } from "motion/react"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { cn } from "@/lib/utils"

type MascotFaceProps = {
  name: string
  expression?: Expression
  /** Shakes its head once whenever this changes (not on the first render). */
  shakeKey?: number
  lookAt?: GazeTarget
  travel?: number
  palette?: Palette
  className?: string
}

// To one side, to the other, and back: a head shaken "no", not a rumble.
const SHAKE = [0, -7, 7, -5, 5, 0]

/** A blobatar with a pose and a shake of the head: the face of the mascot and of the onboarding guide. */
export function MascotFace({ shakeKey, className, ...gaze }: MascotFaceProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!shakeKey || shouldReduceMotion) return
    void animate(scope.current, { x: SHAKE }, { duration: 0.45, ease: "easeInOut" })
  }, [shakeKey, shouldReduceMotion, animate, scope])

  return (
    <div
      ref={scope}
      className={cn("size-full", className)}
    >
      <GazeBlobatar
        {...gaze}
        className="size-full"
      />
    </div>
  )
}
