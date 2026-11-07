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
  /** `ring` is the table of the home page; `row` is the compact version for cards. */
  layout?: "ring" | "row"
  /** Written under a free seat in the `row` layout, e.g. "Free". */
  freeLabel?: string
  /** `always` for one group of five (the ring's default), `hover` in a list (the row's default). */
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
  layout = "ring",
  freeLabel,
  motion = layout === "row" ? "hover" : "always",
  label,
  hasGuide = true,
  className,
}: KvintetSeatsProps) {
  if (layout === "row") {
    return (
      <ul
        role={label ? "img" : undefined}
        aria-label={label}
        className={cn("flex flex-wrap gap-x-3.5 gap-y-3", className)}
      >
        {Array.from({ length: SEATS }, (_, i) => {
          const member = members[i]
          return (
            <li
              key={i}
              data-seat={member ? "member" : "free"}
              className={cn(
                "flex flex-col items-center gap-1.5 text-small",
                member ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="grid size-9 place-items-center">
                {!member ? (
                  <FreeSeat className="size-7" />
                ) : member.anonymous ? (
                  <AnonymousBlobatar
                    seed={member.seed}
                    motion={motion}
                    className="size-9"
                  />
                ) : (
                  <Face
                    seed={member.seed}
                    motion={motion}
                    className="size-9"
                  />
                )}
              </span>
              <span className="max-w-16 truncate">{member ? member.label : freeLabel}</span>
            </li>
          )
        })}
      </ul>
    )
  }

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
