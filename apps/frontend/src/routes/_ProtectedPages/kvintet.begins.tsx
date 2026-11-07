import { createFileRoute } from "@tanstack/react-router"

import { KvintetBeginsPage } from "@/features/kvintet/components/KvintetBeginsPage"

export const Route = createFileRoute("/_ProtectedPages/kvintet/begins")({
  component: KvintetBeginsPage,
})
