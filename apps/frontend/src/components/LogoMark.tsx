import logoMark from "@/assets/logo-mark.svg"
import { cn } from "@/lib/utils"

// One mark for both themes: the petals are the blobatar colours and read on light and dark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoMark}
      alt=""
      width={28}
      height={28}
      className={cn("size-7", className)}
    />
  )
}
