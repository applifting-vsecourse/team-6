import { useGaze } from "@blobatar/react/gaze"

import "blobatar/motion.css"
import "blobatar/gaze.css"

import { Blobatar } from "@/components/ui/blobatar"

/** Live avatar for the sign-up form: idles, and its eyes follow the cursor. */
export function AvatarPreview({ name }: { name: string }) {
  const { ref } = useGaze({ travel: 3, lookAt: "pointer" })

  return (
    // overflow-visible: the eyes may cross the body outline on a hard glance.
    <Blobatar
      name={name}
      className="size-16 overflow-visible"
      blobatar={{ animate: "always", ref }}
    />
  )
}
