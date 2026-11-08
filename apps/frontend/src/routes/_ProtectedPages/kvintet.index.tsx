import { createFileRoute, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

// Figma has no page for it: Home (H3, H4) shows the kvintet, so the old address leads there.
export const Route = createFileRoute("/_ProtectedPages/kvintet/")({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.overview, replace: true })
  },
})
