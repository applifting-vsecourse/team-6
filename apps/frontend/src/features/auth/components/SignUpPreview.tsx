import { GazeBlobatar } from "@/components/GazeBlobatar"
import { MascotBubbleSlot } from "@/components/Mascot/MascotBubbleSlot"
import { useMascotAnchor } from "@/components/Mascot/MascotContext"
import { Blobatar } from "@/components/ui/blobatar"
import { cn } from "@/lib/utils"

// `palette` takes hex, not CSS variables. This is the grey head of Figma `blob/anon`.
const PLACEHOLDER_PALETTE = { head: "#CED4DE" }
const PLACEHOLDER_SEED = "placeholder"

type SignUpPreviewProps = {
  username: string
  /** `panel`: large and animated beside the form; `inline`: small and static, for phones. */
  variant: "panel" | "inline"
}

/** The face others will see, drawn from the username as it is being typed. */
export function SignUpPreview({ username, variant }: SignUpPreviewProps) {
  // BetterAuth stores usernames lowercase and the rest of the app seeds from the stored value.
  const seed = username.trim().toLowerCase()
  const palette = seed ? undefined : PLACEHOLDER_PALETTE
  const name = seed || PLACEHOLDER_SEED
  // Only the variant that is on screen (see AuthLayout) is a place the mascot can fly to.
  const [anchorRef, isOccupied] = useMascotAnchor("signup-avatar")
  // The mascot is the avatar here and draws it itself; this one only holds its place.
  const hidden = isOccupied ? "invisible" : undefined

  if (variant === "inline") {
    return (
      <span
        ref={anchorRef}
        className={cn("block size-16", hidden)}
      >
        <Blobatar
          name={name}
          className="size-full"
          blobatar={palette ? { palette } : undefined}
        />
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center rounded-lg bg-card p-8 text-center">
      {/* The mascot's bubble lives here, above the avatar and inside the card, so it covers nothing.
        The negative margin reaches into the empty margin round the blob: the drawing never fills
        its square, so without it the bubble would hang well clear of the face. */}
      <MascotBubbleSlot
        id="signup-bubble"
        className="-mb-3 min-h-20 w-full"
      />
      <span
        ref={anchorRef}
        className={cn("block size-40", hidden)}
      >
        <GazeBlobatar
          name={name}
          palette={palette}
          animate="always"
          className="size-full"
        />
      </span>
    </div>
  )
}
