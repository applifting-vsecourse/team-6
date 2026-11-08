import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { StateCard } from "@/components/StateCard"
import { Button } from "@/components/ui/button"

type EmptyKvintetStateProps = {
  feedRoute?: string
}

export function EmptyKvintetState({ feedRoute = ROUTES.kvintetFeed }: EmptyKvintetStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <h1 className="text-title">{t("nav.myKvintet")}</h1>

      <StateCard
        title={t("kvintet.emptyState.title")}
        text={t("kvintet.emptyState.description")}
      >
        <Button asChild>
          <Link to={feedRoute}>{t("kvintet.emptyState.viewProposals")}</Link>
        </Button>
      </StateCard>
    </div>
  )
}
