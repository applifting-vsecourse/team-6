import { createFileRoute } from "@tanstack/react-router"

import { MyKvintetPage } from "@/features/kvintet/components/MyKvintetPage"

export const Route = createFileRoute("/_ProtectedPages/kvintet/")({
  component: MyKvintetPage,
})
