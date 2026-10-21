import { Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"

type TagBadgeProps = {
  label: string
  variant?: "selected" | "suggested" | "readOnly"
  onAction?: () => void
  actionAriaLabel?: string
  className?: string
}

export function TagBadge({
  label,
  variant = "readOnly",
  onAction,
  actionAriaLabel,
  className,
}: TagBadgeProps) {
  if (variant === "selected") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1 text-sm font-normal text-primary-foreground select-none",
          className,
        )}
      >
        <span>{label}</span>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            aria-label={actionAriaLabel ?? `Remove ${label}`}
            className="inline-flex size-4 items-center justify-center rounded-full opacity-80 hover:opacity-100 focus-visible:ring-1 focus-visible:ring-primary-foreground focus-visible:outline-none"
          >
            <X className="size-3 stroke-[2.5]" />
          </button>
        )}
      </span>
    )
  }

  if (variant === "suggested") {
    return (
      <button
        type="button"
        onClick={onAction}
        aria-label={actionAriaLabel ?? `Add ${label}`}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm font-normal text-foreground transition-colors select-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        <span>{label}</span>
        <Plus className="size-3 stroke-[2.5] text-muted-foreground" />
      </button>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm font-normal text-foreground select-none",
        className,
      )}
    >
      {label}
    </span>
  )
}
