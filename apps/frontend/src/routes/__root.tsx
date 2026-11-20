import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"

import "@/styles/global.css"

import { TourController } from "@/app/tour/TourController"
import { MascotProvider } from "@/components/Mascot/MascotContext"
import { MascotOverlay } from "@/components/Mascot/MascotOverlay"
import { Toaster } from "@/components/ui/sonner"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <MascotProvider>
      <Outlet />
      <MascotOverlay />
      <TourController />
      <Toaster
        richColors
        position="top-right"
      />
    </MascotProvider>
  )
}
