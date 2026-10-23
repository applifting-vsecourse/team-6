import { KvintetCapacity } from "./KvintetCapacity"

type KvintetCapacityIndicatorProps = {
  count: number
  total?: number
}

export function KvintetCapacityIndicator({ count, total = 5 }: KvintetCapacityIndicatorProps) {
  return (
    <KvintetCapacity
      filled={count}
      total={total}
    />
  )
}
