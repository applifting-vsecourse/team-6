import { useTranslation } from "react-i18next"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
          // A phone fits two cards.
          className={cn(
            "gap-4 rounded-lg px-4.5 py-4.5 sm:px-6 sm:py-6",
            index === 2 && "max-sm:hidden",
          )}
        >
          <Skeleton className="h-3.5 w-80 max-w-full" />
          <div className="flex gap-3.5 sm:gap-7">
            {Array.from({ length: 5 }, (_, seat) => (
              <Skeleton
                key={seat}
                className="size-12 rounded-full"
              />
            ))}
          </div>
          <Skeleton className="h-3.5 w-45 max-w-full" />
        </Card>
      ))}
      <p className="text-small text-muted-foreground">{t("kvintet.loading")}</p>
    </div>
  )
}
