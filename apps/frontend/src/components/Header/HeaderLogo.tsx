import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { LogoMark } from "@/components/LogoMark"

export function HeaderLogo() {
  return (
    <Link
      to={ROUTES.home}
      className="flex items-center gap-2.5 font-serif text-subheading font-medium text-foreground md:text-2xl"
    >
      <LogoMark />
      Kvintet
    </Link>
  )
}
