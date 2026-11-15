import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { StateAlert } from "@/components/StateAlert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"

import { adminStatsQueryOptions } from "@/features/admin/api/adminStatsQueryOptions"

type Row = { label: string; value: number | undefined }

/** One group of numbers: a heading and label/value rows divided by hairlines. */
function StatGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-h3">{title}</h2>
      <dl className="divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-3"
          >
            <dt className="text-body">{row.label}</dt>
            <dd className="text-subheading font-medium text-foreground">
              {row.value === undefined ? (
                <Skeleton className="h-6 w-10" />
              ) : (
                formatNumber(row.value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function AdminStatsPage() {
  const { t } = useTranslation()
  const stats = useQuery(adminStatsQueryOptions())
  const { users, kvintets } = stats.data ?? {}

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
            rows={[
              { label: t("admin.users.registered"), value: users?.registered },
              { label: t("admin.users.onboarded"), value: users?.onboarded },
              { label: t("admin.users.activeToday"), value: users?.activeToday },
            ]}
          />
          <StatGroup
            title={t("admin.kvintets.title")}
            rows={[
              { label: t("admin.kvintets.total"), value: kvintets?.total },
              { label: t("admin.kvintets.active"), value: kvintets?.active },
              { label: t("admin.kvintets.formingSmall"), value: kvintets?.formingSmall },
              { label: t("admin.kvintets.formingReady"), value: kvintets?.formingReady },
            ]}
          />
        </div>
      )}
    </div>
  )
}
