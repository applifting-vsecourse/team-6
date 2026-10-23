import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"
import type { KvintetTab } from "@/features/kvintet/lib/kvintetTab"

import { ActiveKvintetView } from "./ActiveKvintetView"
import { EmptyKvintetState } from "./EmptyKvintetState"
import { ProposalKvintetView } from "./ProposalKvintetView"

type MyKvintetPageProps = {
  tab: KvintetTab
  onTabChange: (tab: KvintetTab) => void
  renderChat: (currentUserId: string | undefined) => ReactNode
}

export function MyKvintetPage({ tab, onTabChange, renderChat }: MyKvintetPageProps) {
  const { t } = useTranslation()
  const {
    data: kvintet,
    isLoading,
    isError,
    refetch,
    vote,
    isVoting,
    leave,
    isLeaving,
  } = useMyKvintet()

  return (
    <>
      <Seo title={t("nav.myKvintet")} />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-10 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <h2 className="text-subheading text-destructive">{t("errors.somethingWentWrong")}</h2>
            <p className="text-body text-muted-foreground">{t("errors.internal_error")}</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
            >
              {t("common.reload")}
            </Button>
          </div>
        ) : !kvintet ? (
          <EmptyKvintetState />
        ) : kvintet.status === "ACTIVE" ? (
          <ActiveKvintetView
            kvintet={kvintet}
            tab={tab}
            onTabChange={onTabChange}
            renderChat={renderChat}
            onLeave={leave}
            isLeaving={isLeaving}
          />
        ) : (
          <ProposalKvintetView
            kvintet={kvintet}
            onVote={vote}
            isVoting={isVoting}
            onLeave={leave}
            isLeaving={isLeaving}
          />
        )}
      </div>
    </>
  )
}
