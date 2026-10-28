import { createFileRoute, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

export const Route = createFileRoute("/_ProtectedPages/profile")({
  loader: () => {
    throw redirect({ to: ROUTES.overview })
  },
})
