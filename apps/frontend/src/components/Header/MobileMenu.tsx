import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DisabledNavItem } from "@/components/Header/DisabledNavItem"
import { LanguageSwitcher } from "@/components/Header/LanguageSwitcher"
import { NAV_ITEMS, type NavDisabled } from "@/components/Header/nav"
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"
import { LogoMark } from "@/components/LogoMark"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileMenuProps = {
  hasNav?: boolean
  navDisabled?: NavDisabled
  // Account block (name + sign out). Passed as a slot so `components/` doesn't
  // have to import from `features/auth`.
  account?: ReactNode
}

export function MobileMenu({ hasNav = false, navDisabled, account }: MobileMenuProps) {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t("layout.openMenu")}
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
        <SheetTitle className="sr-only">{t("layout.menu")}</SheetTitle>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5 font-serif text-subheading font-medium text-foreground">
            <LogoMark />
            Kvintet
          </div>
          <SheetClose
            aria-label={t("layout.closeMenu")}
            className="p-1"
          >
            <X className="size-5.5" />
          </SheetClose>
        </div>
        {hasNav ? (
          <nav
            aria-label={t("layout.mainNavigation")}
            className="flex flex-col px-4 py-2"
          >
            {NAV_ITEMS.map((item) => {
              const reason = navDisabled?.[item.to]
              return reason ? (
                <DisabledNavItem
                  key={item.to}
                  reason={reason}
                  className="flex items-center gap-2.5 border-b border-border py-4 font-serif text-xl font-semibold"
                >
                  {t(item.labelKey)}
                </DisabledNavItem>
              ) : (
                <SheetClose
                  asChild
                  key={item.to}
                >
                  <Link
                    to={item.to}
                    activeOptions={{ exact: true }}
                    className="flex items-center gap-2.5 border-b border-border py-4 font-serif text-xl font-semibold text-foreground before:hidden before:h-5 before:w-0.75 before:bg-foreground data-[status=active]:before:block"
                  >
                    {t(item.labelKey)}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>
        ) : null}
        <div className="mx-4 flex flex-col gap-3.5 border-b border-border py-4">
          <div className="flex items-center justify-between">
            <span className="text-body">{t("common.language")}</span>
            <LanguageSwitcher variant="pills" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body">{t("common.theme")}</span>
            <ThemeSwitcher variant="pills" />
          </div>
        </div>
        {account ? <div className="px-4 py-4">{account}</div> : null}
      </SheetContent>
    </Sheet>
  )
}
