import { useTranslation } from "react-i18next"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KvintetFeedSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className="flex flex-col gap-6"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Card
          key={index}
          aria-hidden
          className="gap-4 rounded-lg bg-secondary px-7 py-6"
        >
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          {Array.from({ length: 3 }, (_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 border-t border-border py-2.5"
            >
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">{t("kvintet.loading")}</p>
    </div>
  )
}
