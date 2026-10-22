import type { ReactNode } from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type DisabledNavItemProps = {
  children: ReactNode
  // Why the item can't be used; shown in a tooltip on hover and keyboard focus.
  reason: string
  className?: string
}

/** A nav entry that looks like a link but isn't one, and says why. */
export function DisabledNavItem({ children, reason, className }: DisabledNavItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Focusable on purpose: a disabled control can't receive focus, and the reason must be reachable by keyboard. */}
          <span
            role="link"
            aria-disabled="true"
            tabIndex={0}
            className={cn("cursor-not-allowed text-muted-foreground opacity-60", className)}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
