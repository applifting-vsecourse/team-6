import { createFileRoute } from "@tanstack/react-router"

import { requireOnboarded } from "@/app/requireOnboarded"

import { KvintetBeginsPage } from "@/features/kvintet/components/KvintetBeginsPage"

export const Route = createFileRoute("/_ProtectedPages/kvintet/begins")({
  beforeLoad: requireOnboarded,
  component: KvintetBeginsPage,
})
