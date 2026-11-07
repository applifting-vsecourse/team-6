import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { PageLayout } from "@/components/PageLayout"
import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

type NotFoundProps = {
  /** The app header; passed in so `components/` doesn't import from `features/auth`. */
  header: ReactNode
}

export function NotFound({ header }: NotFoundProps) {
  const { t } = useTranslation()

  return (
    <PageLayout header={header}>
      <div className="pt-20 pb-22 md:pt-30">
        <ErrorLayout
          seed="seat-7"
          eyebrow="404"
          title={t("errors.pageNotFound")}
          description={t("errors.pageNotFoundDescription")}
          action={
            <Button asChild>
              <Link to={ROUTES.home}>{t("common.goHome")}</Link>
            </Button>
          }
        />
      </div>
    </PageLayout>
  )
}
