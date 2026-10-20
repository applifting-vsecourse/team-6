import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

type RootErrorBoundaryProps = {
  error: Error
}

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  return (
    <ErrorLayout
      title="Něco se pokazilo"
      description={error.message || "Došlo k neočekávané chybě."}
      action={<Button onClick={() => window.location.reload()}>Načíst znovu</Button>}
    />
  )
}
