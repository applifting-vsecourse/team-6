import { useTranslation } from "react-i18next"

import seatFilledDark from "@/assets/seat-filled-dark.svg"
import seatFilled from "@/assets/seat-filled.svg"
import seatFreeDark from "@/assets/seat-free-dark.svg"
import seatFree from "@/assets/seat-free.svg"
import { ThemedImage } from "@/components/ThemedImage"
import { formatNumber } from "@/lib/date"

// Five seats drawn as the Kvintet flower (px from the Figma frame). Filled = member,
// outline = free spot. Never a score.
const SEATS = [
  { left: 14, top: 0 },
  { left: 27.31, top: 9.67 },
  { left: 22.23, top: 25.33 },
  { left: 5.77, top: 25.33 },
  { left: 0.69, top: 9.67 },
]

type KvintetCapacityProps = {
  filled: number
  total: number
}

export function KvintetCapacity({ filled, total }: KvintetCapacityProps) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div
        aria-hidden
        className="relative size-14"
      >
        {SEATS.map((seat, index) => (
          <ThemedImage
            key={index}
            light={index < filled ? seatFilled : seatFree}
            dark={index < filled ? seatFilledDark : seatFreeDark}
            width={28}
            height={28}
            className="absolute size-7"
            style={seat}
          />
        ))}
      </div>
      <p className="font-mono text-xs tracking-meta whitespace-nowrap text-body uppercase">
        {t("kvintet.seats", { filled: formatNumber(filled), total: formatNumber(total) })}
      </p>
    </div>
  )
}
