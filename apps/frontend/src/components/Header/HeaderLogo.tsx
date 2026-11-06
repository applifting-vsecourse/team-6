import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Wordmark } from "@/components/Wordmark"

export function HeaderLogo() {
  return (
    <Link
      to={ROUTES.home}
      className="flex items-center"
    >
      <Wordmark />
    </Link>
  )
}
