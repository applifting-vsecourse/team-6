import logoMarkDark from "@/assets/logo-mark-dark.svg"
import logoMark from "@/assets/logo-mark.svg"
import { ThemedImage } from "@/components/ThemedImage"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <ThemedImage
      light={logoMark}
      dark={logoMarkDark}
      width={32}
      height={32}
      className={cn("size-8", className)}
    />
  )
}
