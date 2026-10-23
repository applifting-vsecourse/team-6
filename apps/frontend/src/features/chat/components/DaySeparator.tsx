import { formatLongDate } from "@/lib/date"

export function DaySeparator({ date }: { date: string }) {
  return (
    <li className="flex items-center gap-4">
      <span
        className="h-px flex-1 bg-border"
        aria-hidden="true"
      />
      <span className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
        {formatLongDate(date)}
      </span>
      <span
        className="h-px flex-1 bg-border"
        aria-hidden="true"
      />
    </li>
  )
}
