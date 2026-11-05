import { Blobatar } from "@/components/ui/blobatar"
import { cn } from "@/lib/utils"

// `palette` takes hex, not CSS variables. This is the grey head of Figma `blob/anon`.
const ANONYMOUS_PALETTE = { head: "#CED4DE" }

type AnonymousBlobatarProps = {
  /** Seed by seat or membership, never by who the person is. */
  seed: string
  className?: string
}

/** Someone who is not in your group yet: a grey blobatar that reveals nothing about them. */
export function AnonymousBlobatar({ seed, className }: AnonymousBlobatarProps) {
  return (
    <Blobatar
      name={seed}
      className={className}
      blobatar={{ palette: ANONYMOUS_PALETTE }}
    />
  )
}

/** A seat nobody has taken: a dashed circle, decorative. */
export function FreeSeat({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block size-8 shrink-0 rounded-full border border-dashed border-border",
        className,
      )}
    />
  )
}

export type SeatMember = {
  seed: string
  /** Grey while the person is not in your group, colour once they are. */
  anonymous?: boolean
}

type KvintetSeatsProps = {
  members: SeatMember[]
  capacity?: number
  /** `row` is compact (cards); `ring` is the table of the home page and "kvintet begins". */
  layout?: "row" | "ring"
  /** Size of one seat in `row`, e.g. `size-9`. In `ring` seats scale with the container. */
  seatClassName?: string
  /** Set when the group stands alone and nothing next to it says who is in it. */
  label?: string
  className?: string
}

// Five seats on a circle, starting at the top and going clockwise. Positions are
// percentages of the container, so the ring scales with whatever size it is given.
const RING_RADIUS = 36
const RING_SEAT = 28

function ringPosition(index: number, count: number) {
  const angle = ((-90 + (index * 360) / count) * Math.PI) / 180
  return {
    left: `${50 + RING_RADIUS * Math.cos(angle) - RING_SEAT / 2}%`,
    top: `${50 + RING_RADIUS * Math.sin(angle) - RING_SEAT / 2}%`,
    width: `${RING_SEAT}%`,
    height: `${RING_SEAT}%`,
  }
}

/** A kvintet as up to five seats: your group in colour, strangers grey, the rest dashed. */
export function KvintetSeats({
  members,
  capacity = 5,
  layout = "row",
  seatClassName,
  label,
  className,
}: KvintetSeatsProps) {
  const seats = Array.from({ length: capacity }, (_, index) => {
    const member = members[index]
    return member ? (
      member.anonymous ? (
        <AnonymousBlobatar
          key={index}
          seed={member.seed}
          className={layout === "ring" ? "size-full" : seatClassName}
        />
      ) : (
        <Blobatar
          key={index}
          name={member.seed}
          className={layout === "ring" ? "size-full" : seatClassName}
        />
      )
    ) : (
      <FreeSeat
        key={index}
        className={layout === "ring" ? "size-full" : seatClassName}
      />
    )
  })

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        layout === "ring" ? "relative aspect-square" : "flex items-center gap-1.5",
        className,
      )}
    >
      {layout === "ring"
        ? seats.map((seat, index) => (
            <div
              key={index}
              className="absolute"
              style={ringPosition(index, capacity)}
            >
              {seat}
            </div>
          ))
        : seats}
    </div>
  )
}
