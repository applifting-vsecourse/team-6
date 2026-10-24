import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { SUPPORT_EMAIL } from "@/config/support"
import { formatDate } from "@/lib/date"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import { formatCommonPreferences } from "@/features/kvintet/lib/formatPreferences"

import { KvintetMemberList } from "./KvintetMemberList"
import { KvintetTableDiagram } from "./KvintetTableDiagram"
import { LeaveKvintetDialog } from "./LeaveKvintetDialog"

type ActiveKvintetViewProps = {
  kvintet: KvintetDetails
  onLeave: () => void
  isLeaving: boolean
}

export function ActiveKvintetView({ kvintet, onLeave, isLeaving }: ActiveKvintetViewProps) {
  const { t } = useTranslation()
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const activatedDate = kvintet.activatedAt
    ? formatDate(new Date(kvintet.activatedAt))
    : formatDate(new Date(kvintet.createdAt))

  const formattedPreferences = formatCommonPreferences(kvintet.commonPreferences, t)

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 font-mono text-xs tracking-meta text-primary uppercase">
            {t("kvintet.statusActive")}
          </span>
        </div>

        <h1 className="text-title">{kvintet.title}</h1>

        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
          {formattedPreferences
            ? t("kvintet.activeSubtitleWithPreferences", {
                date: activatedDate,
                count: kvintet.members.length,
                preferences: formattedPreferences,
              })
            : t("kvintet.activeSubtitle", {
                date: activatedDate,
                count: kvintet.members.length,
              })}
        </p>
      </div>

      {/* Visual circular table seating diagram */}
      <KvintetTableDiagram members={kvintet.members} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
        {/* Left column: members list */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <h2 className="text-heading">{t("kvintet.members.heading")}</h2>
          <KvintetMemberList
            members={kvintet.members}
            isActive={true}
          />
        </div>

        {/* Right column: side info & actions */}
        <aside className="flex flex-col gap-6 md:border-l md:border-border md:pl-8">
          {/* Group chat box */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
            <h3 className="text-subheading">{t("kvintet.chat.heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("kvintet.chat.description")}</p>
            <Button
              asChild
              variant="default"
              className="mt-1 w-full"
            >
              <Link to={ROUTES.kvintetMessages}>{t("kvintet.chat.openMessages")}</Link>
            </Button>
          </div>

          {/* Report issue */}
          <div className="border-t border-border pt-4">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              {t("kvintet.actions.reportIssue")}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("kvintet.actions.reportIssueHint")}
            </p>
          </div>

          {/* Leave kvintet */}
          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsLeaveDialogOpen(true)}
              className="h-auto justify-start p-0 text-sm font-semibold text-foreground underline hover:text-muted-foreground"
            >
              {t("kvintet.actions.leaveKvintet")}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("kvintet.actions.leaveKvintetHint")}
            </p>
          </div>
        </aside>
      </div>

      <LeaveKvintetDialog
        isOpen={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        onConfirm={() => {
          onLeave()
          setIsLeaveDialogOpen(false)
        }}
        isLeaving={isLeaving}
        isActiveKvintet={true}
      />
    </div>
  )
}
