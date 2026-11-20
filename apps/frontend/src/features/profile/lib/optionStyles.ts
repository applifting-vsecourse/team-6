import { cn } from "@/lib/utils"

// The answers of the onboarding (Figma #126): no cards and no frames, only soft shapes. What is
// chosen is the accent colour (`highlight`) on its soft fill.

/** A chip: a field of work, a topic. Chosen = accent-soft with an accent edge and text. */
export const chipClass = (isOn: boolean) =>
  cn(
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-small transition-colors select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    isOn
      ? "border-highlight bg-highlight-soft text-highlight"
      : "border-border bg-card text-foreground hover:bg-secondary",
  )

/** A tile: one answer of a list. The whole row is the target, chosen = accent-soft. */
export const tileClass =
  "flex cursor-pointer items-center gap-3.5 rounded-2xl bg-card px-5 py-4 text-compact font-medium text-foreground transition-colors has-[[data-state=checked]]:bg-highlight-soft"

// The indicator of a tile: 22px, surface-2 when empty, the accent when chosen. The kit's defaults
// are a navy 16/20px with an edge.
export const tileCheckboxClass =
  "size-5.5 rounded-md border-0 bg-secondary data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground"

export const tileRadioClass =
  "size-5.5 border-0 bg-secondary data-[state=checked]:bg-highlight [&_svg]:fill-highlight-foreground [&_svg]:stroke-highlight-foreground"

/** The search field and the note: white, no edge, soft corners. */
export const softFieldClass =
  "rounded-xl border-0 bg-card px-4 text-compact shadow-none placeholder:text-muted-foreground"
