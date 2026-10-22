import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

import type { KvintetDetails } from "@/features/kvintet/api/kvintetApi"

import { KvintetCapacityIndicator } from "./KvintetCapacityIndicator"
import { KvintetMemberList } from "./KvintetMemberList"
import { LeaveKvintetDialog } from "./LeaveKvintetDialog"

type ProposalKvintetViewProps = {
  kvintet: KvintetDetails
  onVote: () => void
  isVoting: boolean
  onLeave: () => void
  isLeaving: boolean
}

export function ProposalKvintetView({
  kvintet,
  onVote,
  isVoting,
  onLeave,
  isLeaving,
}: ProposalKvintetViewProps) {
  const { t } = useTranslation()
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const canShowVoteBox = kvintet.members.length >= 3 && kvintet.members.length <= 4

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 font-mono text-xs tracking-meta text-muted-foreground uppercase">
            {t("kvintet.statusProposal", { count: kvintet.members.length })}
          </span>
        </div>

        <h1 className="text-title">{kvintet.title}</h1>

        {kvintet.commonPreferences && (
          <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
            {t("kvintet.proposalSubtitle", {
              preferences: kvintet.commonPreferences,
            })}
          </p>
        )}
      </div>

      {/* Vote banner */}
      {canShowVoteBox && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-primary/30 bg-card p-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
              {t("kvintet.vote.title")}
            </span>
            <p className="text-base font-semibold text-foreground">
              {t("kvintet.vote.countText", {
                voted: kvintet.voteStatus.votedCount,
                total: kvintet.voteStatus.totalCount,
              })}
            </p>
            <p className="text-sm text-muted-foreground">{t("kvintet.vote.hint")}</p>
          </div>

          <div className="shrink-0">
            {kvintet.voteStatus.userHasVoted ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground">
                ✓ {t("kvintet.vote.voted")}
              </span>
            ) : (
              <Button
                variant="default"
                onClick={onVote}
                disabled={isVoting}
              >
                {isVoting ? t("kvintet.vote.voting") : t("kvintet.vote.button")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
        {/* Left column: members list */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-heading">{t("kvintet.members.heading")}</h2>
              <KvintetCapacityIndicator count={kvintet.members.length} />
            </div>
            <span className="text-xs text-muted-foreground">
              {t("kvintet.members.namesHiddenHint")}
            </span>
          </div>

          <KvintetMemberList
            members={kvintet.members}
            isActive={false}
          />
        </div>

        {/* Right column: side info */}
        <aside className="flex flex-col gap-6 md:border-l md:border-border md:pl-8">
          {/* What happens next */}
          <div className="flex flex-col gap-3">
            <h3 className="text-subheading">{t("kvintet.nextSteps.heading")}</h3>
            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-mono font-medium text-foreground">1</span>
                <span>{t("kvintet.nextSteps.step1")}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-medium text-foreground">2</span>
                <span>{t("kvintet.nextSteps.step2")}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-medium text-foreground">3</span>
                <span>{t("kvintet.nextSteps.step3")}</span>
              </li>
            </ol>
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setIsLeaveDialogOpen(true)}
              className="text-left text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground"
            >
              {t("kvintet.actions.leaveProposal")}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("kvintet.actions.leaveProposalHint")}
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
        isActiveKvintet={false}
      />
    </div>
  )
}
