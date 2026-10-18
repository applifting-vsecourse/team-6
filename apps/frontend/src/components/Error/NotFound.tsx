import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

export function NotFound() {
  const { t } = useTranslation()

  return (
    <ErrorLayout
      title={t("errors.pageNotFound")}
      description={t("errors.pageNotFoundDescription")}
      action={
        <Button asChild>
          <Link to={ROUTES.home}>{t("common.goHome")}</Link>
        </Button>
      }
    />
  )
}
