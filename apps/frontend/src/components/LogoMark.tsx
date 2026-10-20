import logoMark from "@/assets/logo-mark.svg"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoMark}
      alt=""
      width={32}
      height={32}
      className={cn("size-8", className)}
    />
  )
}
