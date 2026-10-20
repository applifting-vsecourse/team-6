import { HeaderNavLink } from "@/components/Header/HeaderNavLink"
import { NAV_ITEMS } from "@/components/Header/nav"
import { cn } from "@/lib/utils"

export function HeaderNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Hlavní navigace"
      className={cn("items-center gap-8", className)}
    >
      {NAV_ITEMS.map((item) => (
        <HeaderNavLink
          key={item.to}
          to={item.to}
        >
          {item.label}
        </HeaderNavLink>
      ))}
    </nav>
  )
}
