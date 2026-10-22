import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import watermark from "@/assets/logo-watermark.svg"
import { Button } from "@/components/ui/button"

type EmptyKvintetStateProps = {
  feedRoute?: string
}

export function EmptyKvintetState({ feedRoute = ROUTES.kvintetFeed }: EmptyKvintetStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <h1 className="text-title">{t("nav.myKvintet")}</h1>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 py-14 text-center md:py-20">
        <img
          src={watermark}
          alt=""
          width={72}
          height={72}
          className="size-18 opacity-40"
        />

        <h3 className="mt-6 text-subheading">{t("kvintet.emptyState.title")}</h3>

        <p className="mt-2 max-w-sm text-body text-muted-foreground">
          {t("kvintet.emptyState.description")}
        </p>

        <div className="mt-6">
          <Button
            asChild
            variant="default"
          >
            <Link to={feedRoute}>{t("kvintet.emptyState.viewProposals")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
