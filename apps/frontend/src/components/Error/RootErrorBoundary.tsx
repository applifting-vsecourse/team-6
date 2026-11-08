import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errorMessage"

import { ErrorLayout } from "./ErrorLayout"

type RootErrorBoundaryProps = {
  error: Error
}

// No app chrome here: the crash may be the session or the router itself.
export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  const { t } = useTranslation()

  return (
    <main className="grid min-h-svh place-content-center py-24">
      <ErrorLayout
        seed="seat-5"
        title={t("errors.somethingWentWrong")}
        description={getErrorMessage(error)}
        action={<Button onClick={() => window.location.reload()}>{t("common.reload")}</Button>}
      />
    </main>
  )
}
