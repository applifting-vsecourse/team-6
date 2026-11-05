import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { LogoMark } from "@/components/LogoMark"

export function HeaderLogo() {
  return (
    <Link
      to={ROUTES.home}
      className="flex items-center gap-2.5 text-logo font-semibold text-foreground"
    >
      <LogoMark />
      Kvintet
    </Link>
  )
}
