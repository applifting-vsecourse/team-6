import {
  AnonymousBlobatar,
  Face,
  FreeSeat,
  type BlobatarMotion,
} from "@/components/AnonymousBlobatar"
import { cn } from "@/lib/utils"

const SEATS = 5

// Seat centres on a circle, from the top and clockwise, as unit offsets from the middle.
const POSITIONS = Array.from({ length: SEATS }, (_, i) => {
  const angle = ((-90 + i * 72) * Math.PI) / 180
  return { x: Math.cos(angle), y: Math.sin(angle) }
})

export type SeatMember = {
  /** Same seed as everywhere else for this person; an opaque seat value when `anonymous`. */
  seed: string
  /** Someone you have not met yet: grey, so the face reveals nothing. */
  anonymous?: boolean
  /** Written under the seat, e.g. the first name. Leave out where names are not known. */
  label?: string
}

type KvintetSeatsProps = {
  /** At most five; the rest of the table is filled with free seats. */
  members: SeatMember[]
  /** `always` for one group of five (DESIGN.md, "People are blobatars"). */
  motion?: BlobatarMotion
  /** Only when the table stands alone; leave it out when the text beside it says the same. */
  label?: string
  /** The dashed ring behind the seats; Figma K3 / M9 ("Kvintet begins") draws none. */
  hasGuide?: boolean
  className?: string
}

/**
 * A kvintet as exactly five seats on a ring: members first, then dashed free seats, never a
 * number. It fills its parent (a square), so the parent sets the size. Figma A1 and M1 draw
 * the seats at 22 % of the width on a ring of radius 36 % on desktop, 23 % and 34 % on a phone.
 * Figma K3 / M9 ("Kvintet begins") draws them at 27 % on a ring of 36.5 % with their names
 * underneath and no guide ring: pass `hasGuide={false}` and the two variables in `className`.
 */
export function KvintetSeats({
  members,
  motion = "always",
  label,
  hasGuide = true,
  className,
}: KvintetSeatsProps) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "relative aspect-square w-full [--seat-radius:34%] [--seat:23.1%] md:[--seat-radius:36%] md:[--seat:22.1%]",
        className,
      )}
    >
      {hasGuide ? (
        <span
          aria-hidden="true"
          className="absolute rounded-full border border-dashed border-input"
          style={{
            inset: "calc(50% - var(--seat-radius))",
          }}
        />
      ) : null}
      {POSITIONS.map((position, i) => {
        const member = members[i]
        return (
          <span
            key={i}
            data-seat={member ? "member" : "free"}
            className="absolute aspect-square"
            style={{
              width: "var(--seat)",
              left: `calc(50% + ${position.x} * var(--seat-radius) - var(--seat) / 2)`,
              top: `calc(50% + ${position.y} * var(--seat-radius) - var(--seat) / 2)`,
            }}
          >
            {!member ? (
              <FreeSeat className="size-full" />
            ) : member.anonymous ? (
              <AnonymousBlobatar
                seed={member.seed}
                motion={motion}
                className="size-full"
              />
            ) : (
              <Face
                seed={member.seed}
                motion={motion}
                className="size-full"
              />
            )}
            {member?.label ? (
              <span className="absolute top-full left-1/2 -translate-x-1/2 text-small whitespace-nowrap text-foreground md:text-label md:font-medium">
                {member.label}
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
