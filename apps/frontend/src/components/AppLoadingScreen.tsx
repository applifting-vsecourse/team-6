import { useTranslation } from "react-i18next"

import { AnonymousBlobatar } from "@/components/AnonymousBlobatar"

export function AppLoadingScreen() {
  const { t } = useTranslation()

  return (
    <main className="grid min-h-svh place-content-center justify-items-center gap-4.5">
      <AnonymousBlobatar
        seed="seat-1"
        motion="always"
        className="size-20"
      />
      <p
        role="status"
        className="text-small text-muted-foreground"
      >
        {t("common.loadingApp")}
      </p>
    </main>
  )
}
