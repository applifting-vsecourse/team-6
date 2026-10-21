import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { NAV_ITEMS } from "@/components/Header/nav"
import { LogoMark } from "@/components/LogoMark"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileMenuProps = {
  // Account block (name + sign out). Passed as a slot so `components/` doesn't
  // have to import from `features/auth`.
  account?: ReactNode
}

export function MobileMenu({ account }: MobileMenuProps) {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Otevřít menu"
        className="p-1 md:hidden"
      >
        <Menu className="size-5.5" />
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-svh gap-0 border-0"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5 font-serif text-subheading font-medium text-foreground">
            <LogoMark />
            Kvintet
          </div>
          <SheetClose
            aria-label="Zavřít menu"
            className="p-1"
          >
            <X className="size-5.5" />
          </SheetClose>
        </div>
        <nav
          aria-label="Hlavní navigace"
          className="flex flex-col px-4 py-2"
        >
          {NAV_ITEMS.map((item) => (
            <SheetClose
              asChild
              key={item.to}
            >
              <Link
                to={item.to}
                className="flex items-center gap-2.5 border-b border-border py-4 font-serif text-xl font-semibold text-foreground before:hidden before:h-5 before:w-0.75 before:bg-foreground data-[status=active]:before:block"
              >
                {t(item.labelKey)}
              </Link>
            </SheetClose>
          ))}
        </nav>
        {account ? <div className="px-4 py-6">{account}</div> : null}
      </SheetContent>
    </Sheet>
  )
}
