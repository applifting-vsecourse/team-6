import { useTranslation } from "react-i18next"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KvintetFeedSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className="flex flex-col gap-5 sm:gap-3.5"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Card
          key={index}
          aria-hidden
          className="gap-4.5 rounded-lg px-4.5 py-4.5 sm:px-6 sm:py-6"
        >
          <Skeleton className="h-6 w-2/3" />
          <div className="flex gap-3.5 sm:gap-7">
            {Array.from({ length: 5 }, (_, seat) => (
              <Skeleton
                key={seat}
                className="size-12 rounded-full"
              />
            ))}
          </div>
          <Skeleton className="h-10.5 w-full" />
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">{t("kvintet.loading")}</p>
    </div>
  )
}
