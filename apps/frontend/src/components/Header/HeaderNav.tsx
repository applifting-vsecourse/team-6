import { useTranslation } from "react-i18next"

import { HeaderNavLink } from "@/components/Header/HeaderNavLink"
import { NAV_ITEMS } from "@/components/Header/nav"
import { cn } from "@/lib/utils"

export function HeaderNav({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("layout.mainNavigation")}
      className={cn("items-center gap-8", className)}
    >
      {NAV_ITEMS.map((item) => (
        <HeaderNavLink
          key={item.to}
          to={item.to}
        >
          {t(item.labelKey)}
        </HeaderNavLink>
      ))}
    </nav>
  )
}
