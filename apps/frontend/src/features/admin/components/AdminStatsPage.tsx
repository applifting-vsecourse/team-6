import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { StateAlert } from "@/components/StateAlert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { env } from "@/config/env"
import { formatNumber } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"

import { adminStatsQueryOptions } from "@/features/admin/api/adminStatsQueryOptions"

// One hue in three steps: a kvintet moves forming -> ready to vote -> started, darker as it progresses.
const STAGE = {
  forming: "bg-highlight/30",
  ready: "bg-highlight/60",
  started: "bg-highlight",
} as const

type Stage = keyof typeof STAGE

type Row = {
  label: string
  value: number | undefined
  /** Share of all registered people, drawn as a meter under the row. */
  share?: number
  /** Colour dot tying the row to its block in the segmented bar. */
  stage?: Stage
}

/** A thin bar: a lighter track of the same hue with the filled part on it. */
function Meter({ share }: { share: number }) {
  return (
    <div
      aria-hidden
      className="h-2 overflow-hidden rounded-full bg-highlight-soft"
    >
      <div
        className="h-full rounded-full bg-highlight"
        style={{ width: `${Math.min(share, 1) * 100}%` }}
      />
    </div>
  )
}

/** One whole split into stages. The list below carries the numbers, so the bar has no text. */
function StageBar({ parts }: { parts: { stage: Stage; value: number }[] }) {
  return (
    <div
      aria-hidden
      className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-highlight-soft"
    >
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <div
            key={part.stage}
            className={STAGE[part.stage]}
            style={{ flex: `${part.value} 1 0` }}
          />
        ))}
    </div>
  )
}

/** One group of numbers: a heading, an optional hint and bar, then label/value rows. */
function StatGroup({
  title,
  hint,
  bar,
  rows,
}: {
  title: string
  hint?: string
  bar?: ReactNode
  rows: Row[]
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h3">{title}</h2>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {bar}
      <dl className="divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-2 py-3"
          >
            <div className="flex items-baseline justify-between gap-4">
              <dt className="flex items-center gap-2 text-body">
                {row.stage ? (
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${STAGE[row.stage]}`}
                  />
                ) : null}
                {row.label}
              </dt>
              <dd className="flex items-baseline gap-2 text-subheading font-medium text-foreground">
                {row.value === undefined ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  <>
                    {formatNumber(row.value)}
                    {row.share === undefined ? null : (
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatNumber(row.share, { style: "percent" })}
                      </span>
                    )}
                  </>
                )}
              </dd>
            </div>
            {row.share === undefined || row.value === undefined ? null : (
              <Meter share={row.share} />
            )}
          </div>
        ))}
      </dl>
    </section>
  )
}

// The CSV files the backend serves under `admin/export/:dataset`.
const EXPORTS = ["feed", "memberships", "kvintets", "users"] as const

/** Plain links: the browser sends the session cookie and the backend answers with a download. */
function ExportGroup() {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h3">{t("admin.export.title")}</h2>
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map((dataset) => (
          <Button
            key={dataset}
            variant="outline"
            asChild
          >
            <a href={`${env.VITE_API_URL}/admin/export/${dataset}`}>
              {t(`admin.export.${dataset}`)}
            </a>
          </Button>
        ))}
      </div>
    </section>
  )
}

export function AdminStatsPage() {
  const { t } = useTranslation()
  const stats = useQuery(adminStatsQueryOptions())
  const { users, kvintets } = stats.data ?? {}
  // No registrations yet: nothing to take a share of.
  const shareOfRegistered = (value: number | undefined) =>
    value === undefined || !users?.registered ? 0 : value / users.registered

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-7 md:gap-8 md:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1-mobile md:text-h1">{t("admin.title")}</h1>
        <p className="text-compact text-muted-foreground md:text-lead">{t("admin.description")}</p>
      </div>

      {stats.isError ? (
        <StateAlert
          title={t("admin.error.title")}
          text={getErrorMessage(stats.error)}
        >
          <Button
            variant="outline"
            className="bg-card text-foreground max-sm:w-full"
            onClick={() => void stats.refetch()}
          >
            {t("admin.error.retry")}
          </Button>
        </StateAlert>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <StatGroup
            title={t("admin.users.title")}
            hint={t("admin.users.hint")}
            rows={[
              { label: t("admin.users.registered"), value: users?.registered },
              {
                label: t("admin.users.onboarded"),
                value: users?.onboarded,
                share: shareOfRegistered(users?.onboarded),
              },
              {
                label: t("admin.users.activeToday"),
                value: users?.activeToday,
                share: shareOfRegistered(users?.activeToday),
              },
            ]}
          />
          <StatGroup
            title={t("admin.kvintets.title")}
            bar={
              kvintets ? (
                <StageBar
                  parts={[
                    { stage: "forming", value: kvintets.formingSmall },
                    { stage: "ready", value: kvintets.formingReady },
                    { stage: "started", value: kvintets.active },
                  ]}
                />
              ) : null
            }
            rows={[
              { label: t("admin.kvintets.total"), value: kvintets?.total },
              {
                label: t("admin.kvintets.formingSmall"),
                value: kvintets?.formingSmall,
                stage: "forming",
              },
              {
                label: t("admin.kvintets.formingReady"),
                value: kvintets?.formingReady,
                stage: "ready",
              },
              { label: t("admin.kvintets.active"), value: kvintets?.active, stage: "started" },
            ]}
          />
        </div>
      )}

      <ExportGroup />
    </div>
  )
}
