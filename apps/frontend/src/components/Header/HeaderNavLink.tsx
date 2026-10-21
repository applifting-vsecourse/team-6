import type { ReactNode } from "react"
import { Link, type LinkProps } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

type HeaderNavLinkProps = LinkProps & {
  children: ReactNode
  className?: string
}

export function HeaderNavLink({ children, className, ...props }: HeaderNavLinkProps) {
  return (
    <Link
      {...props}
      // Active styling uses the router's data-status attribute rather than
      // `activeProps`: those classes would collide with the base ones and
      // Tailwind resolves such conflicts by stylesheet order, not by class order.
      className={cn(
        "border-b-2 border-transparent py-1 text-label font-semibold text-muted-foreground transition-colors hover:text-foreground",
        "data-[status=active]:border-foreground data-[status=active]:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  )
}
