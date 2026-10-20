import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

export function NotFound() {
  return (
    <ErrorLayout
      title="Stránka nenalezena"
      description="Stránka, kterou hledáte, neexistuje nebo byla přesunuta."
      action={
        <Button asChild>
          <Link to={ROUTES.home}>Na úvodní stránku</Link>
        </Button>
      }
    />
  )
}
