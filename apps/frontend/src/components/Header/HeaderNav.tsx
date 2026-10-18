import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { HeaderNavLink } from "@/components/Header/HeaderNavLink"

// The logo already links home, so "Home" would be a duplicate. Add
// <HeaderNavLink> entries here as protected pages appear.
export function HeaderNav() {
  const { t } = useTranslation()

  return (
    <nav className="flex items-center gap-1">
      <HeaderNavLink to={ROUTES.codeOfConduct}>{t("nav.codeOfConduct")}</HeaderNavLink>
    </nav>
  )
}
