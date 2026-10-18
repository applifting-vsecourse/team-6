import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errorMessage"

import { ErrorLayout } from "./ErrorLayout"

type RootErrorBoundaryProps = {
  error: Error
}

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  const { t } = useTranslation()

  return (
    <ErrorLayout
      title={t("errors.somethingWentWrong")}
      description={getErrorMessage(error)}
      action={<Button onClick={() => window.location.reload()}>{t("common.reload")}</Button>}
    />
  )
}
