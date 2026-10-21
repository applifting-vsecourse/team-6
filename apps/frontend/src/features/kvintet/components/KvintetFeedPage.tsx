import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { LogoMark } from "@/components/LogoMark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/date"

import { kvintetFeedQueryOptions } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { CategoryFilter } from "@/features/kvintet/components/CategoryFilter"
import { KvintetCard } from "@/features/kvintet/components/KvintetCard"
import { KvintetFeedSkeleton } from "@/features/kvintet/components/KvintetFeedSkeleton"
import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"
import { useJoinKvintet } from "@/features/kvintet/hooks/useJoinKvintet"
import { isApiError } from "@/features/kvintet/lib/apiError"

export function KvintetFeedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isStartOpen, setIsStartOpen] = useState(false)
  const kvintets = useQuery(kvintetFeedQueryOptions())
  const join = useJoinKvintet()

  // The feed answers 409 to someone who is already in a kvintet.
  const isMember = isApiError(kvintets.error, "already_in_kvintet")
  useEffect(() => {
    if (!isMember) return
    toast.info(t("kvintet.alreadyMember"))
    void navigate({ to: ROUTES.overview, replace: true })
  }, [isMember, navigate, t])

  const openStart = () => setIsStartOpen(true)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-16 pb-24">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-title">{t("kvintet.title")}</h1>
          <p className="text-lg text-body">{t("kvintet.subtitle")}</p>
        </header>

        <section className="flex flex-col gap-4 rounded-lg border border-primary px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-base font-semibold text-foreground">{t("kvintet.startOwn.title")}</p>
            <p className="text-sm text-body">{t("kvintet.startOwn.text")}</p>
          </div>
          <Button
            variant="outline"
            onClick={openStart}
          >
            {t("kvintet.startOwn.button")}
          </Button>
        </section>

        <CategoryFilter />

        {kvintets.isPending ? <KvintetFeedSkeleton /> : null}

        {kvintets.isError && !isMember ? (
          <Alert
            variant="destructive"
            className="grid-cols-[0.5rem_1fr_auto]"
          >
            <AlertTitle className="col-start-2">{t("kvintet.error.title")}</AlertTitle>
            <AlertDescription className="col-start-2 row-start-2 text-sm">
              {t("kvintet.error.text")}
            </AlertDescription>
            <Button
              variant="outline"
              className="col-start-3 row-span-2 row-start-1 text-foreground"
              onClick={() => void kvintets.refetch()}
            >
              {t("kvintet.error.retry")}
            </Button>
          </Alert>
        ) : null}

        {kvintets.data?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-12 text-center">
            <LogoMark className="size-12" />
            <h2 className="text-subheading font-semibold">{t("kvintet.empty.title")}</h2>
            <p className="text-sm text-body">{t("kvintet.empty.text")}</p>
            <Button
              variant="outline"
              onClick={openStart}
            >
              {t("kvintet.startOwn.button")}
            </Button>
          </div>
        ) : null}

        {kvintets.data?.length ? (
          <>
            <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
              {t("kvintet.count", {
                count: kvintets.data.length,
                formatted: formatNumber(kvintets.data.length),
              })}
            </p>
            <ul className="flex flex-col gap-6">
              {kvintets.data.map((kvintet) => (
                <li key={kvintet.id}>
                  <KvintetCard
                    kvintet={kvintet}
                    isJoining={join.isPending && join.variables === kvintet.id}
                    isDisabled={join.isPending}
                    onJoin={join.mutate}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <StartKvintetDialog
        isOpen={isStartOpen}
        onOpenChange={setIsStartOpen}
      />
    </div>
  )
}
