import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"

import { Favicon } from "@/app/Favicon"
import { router } from "@/app/router"
import { queryClient } from "@/config/react-query"

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <Favicon />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
