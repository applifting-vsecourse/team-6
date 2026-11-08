import { cn } from "@/lib/utils"

// The logo is the word, no mark (Figma logo variant C): Bricolage Grotesque semibold, tight.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-brand text-logo font-semibold tracking-[-0.03em] text-foreground [font-variation-settings:'opsz'_14]",
        className,
      )}
    >
      Kvintet
    </span>
  )
}
