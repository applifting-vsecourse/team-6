import { GazeBlobatar } from "@/components/GazeBlobatar"
import { HoverGazeBlobatar } from "@/components/HoverGazeBlobatar"
import { Blobatar } from "@/components/ui/blobatar"
import { cn } from "@/lib/utils"

// `palette` takes hex, not CSS variables. This is the grey head of Figma `blob/anon`.
const ANONYMOUS_PALETTE = { head: "#CED4DE" }

/**
 * `always`: eyes follow the pointer all the time; for one large avatar or one group of five.
 * `hover`: static until hovered; for lists, so only one driver runs at a time.
 * Without it the avatar is static. See DESIGN.md, "People are blobatars".
 */
export type BlobatarMotion = "always" | "hover"

type FaceProps = {
  seed: string
  className?: string
  motion?: BlobatarMotion
  palette?: typeof ANONYMOUS_PALETTE
}

/** One avatar in the requested motion mode; the shared building block for seats and lists. */
export function Face({ seed, className, motion, palette }: FaceProps) {
  if (motion === "always") {
    return (
      <GazeBlobatar
        name={seed}
        animate="always"
        palette={palette}
        className={className}
      />
    )
  }
  if (motion === "hover") {
    return (
      <HoverGazeBlobatar
        name={seed}
        palette={palette}
        className={className}
      />
    )
  }
  return (
    <Blobatar
      name={seed}
      className={className}
      blobatar={palette ? { palette } : undefined}
    />
  )
}

type AnonymousBlobatarProps = {
  /** Seed by seat or membership, never by who the person is. */
  seed: string
  className?: string
  motion?: BlobatarMotion
}

/** Someone who is not in your group yet: a grey blobatar that reveals nothing about them. */
export function AnonymousBlobatar({ seed, className, motion }: AnonymousBlobatarProps) {
  return (
    <Face
      seed={seed}
      className={className}
      motion={motion}
      palette={ANONYMOUS_PALETTE}
    />
  )
}

/** A seat nobody has taken: a dashed circle, decorative. */
export function FreeSeat({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        // Figma: a 1.5px dashed ring in the strong line colour.
        "block size-8 shrink-0 rounded-full border-[1.5px] border-dashed border-input",
        className,
      )}
    />
  )
}
