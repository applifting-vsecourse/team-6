import { useMemo } from "react"
import type { Expression } from "blobatar/expression"

import {
  useMascotAnchor,
  useMascotContext,
  useMascotStage,
} from "@/components/Mascot/MascotContext"
import { MascotFace } from "@/components/Mascot/MascotFace"

type GuideAvatarProps = {
  /** The person's avatar seed (username, id when there is none). Without it there is no avatar. */
  seed?: string
  expression?: Expression
  /** Shakes its head once each time this changes. */
  shakeKey?: number
}

/**
 * The avatar at the top of every onboarding page (96px). While the tour runs it is the mascot
 * (its overlay stands on this spot, so that after "Done" it can fly on to Home); otherwise, as on
 * a repeat of onboarding or an edit from the profile, the page draws the avatar itself.
 */
export function GuideAvatar({ seed, expression, shakeKey }: GuideAvatarProps) {
  const isMascot = Boolean(useMascotContext()?.isTourActive && seed)
  const [attach] = useMascotAnchor("onboarding-avatar")

  const stage = useMemo(
    () => (isMascot ? { anchorId: "onboarding-avatar", seed, expression, shakeKey } : null),
    [isMascot, seed, expression, shakeKey],
  )
  useMascotStage(stage)

  return (
    <span
      ref={attach}
      className="block size-15 shrink-0 md:size-24"
    >
      {seed && !isMascot ? (
        <MascotFace
          name={seed}
          expression={expression}
          shakeKey={shakeKey}
        />
      ) : null}
    </span>
  )
}
