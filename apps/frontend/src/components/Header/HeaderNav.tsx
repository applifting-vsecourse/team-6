import { useTranslation } from "react-i18next"

import { DisabledNavItem } from "@/components/Header/DisabledNavItem"
import { HeaderNavLink } from "@/components/Header/HeaderNavLink"
import { NAV_ITEMS, type NavDisabled } from "@/components/Header/nav"
import { cn } from "@/lib/utils"

type HeaderNavProps = {
  className?: string
  disabledItems?: NavDisabled
}

export function HeaderNav({ className, disabledItems }: HeaderNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("layout.mainNavigation")}
      className={cn("items-center gap-8", className)}
    >
      {NAV_ITEMS.map((item) => {
        const reason = disabledItems?.[item.to]
        return reason ? (
          <DisabledNavItem
            key={item.to}
            reason={reason}
            className="border-b-2 border-transparent py-1 text-label font-semibold"
          >
            {t(item.labelKey)}
          </DisabledNavItem>
        ) : (
          <HeaderNavLink
            key={item.to}
            to={item.to}
          >
            {t(item.labelKey)}
          </HeaderNavLink>
        )
      })}
    </nav>
  )
}
