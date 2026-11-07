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
  className?: string
}

/**
 * A kvintet as exactly five seats on a ring: members first, then dashed free seats, never a
 * number. It fills a square, so the parent sets the size and the seats scale with it. The
 * default geometry is Figma K3 / M9 ("Kvintet begins"): seats 27 % of the width on a ring of
 * radius 36.5 % (96 px / 130 px at 356 px, 72 px / 100 px at 272 px). Names sit directly under
 * their seat and still fit inside the square.
 */
export function KvintetSeats({ members, motion = "always", label, className }: KvintetSeatsProps) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("relative aspect-square w-full [--seat-radius:36.5%] [--seat:27%]", className)}
    >
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
