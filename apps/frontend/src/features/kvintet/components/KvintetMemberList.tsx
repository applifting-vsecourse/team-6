import { useTranslation } from "react-i18next"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"

type KvintetMemberListProps = {
  members: KvintetMember[]
  isActive: boolean
  totalSeats?: number
}

export function KvintetMemberList({ members, isActive, totalSeats = 5 }: KvintetMemberListProps) {
  const { t } = useTranslation()
  const openSeatsCount = Math.max(0, totalSeats - members.length)

  const formatMemberTags = (member: KvintetMember): string => {
    const parts: string[] = []

    if (member.teachTags.length > 0) {
      parts.push(
        t("kvintet.members.teaches", {
          tags: member.teachTags.join(", "),
        }),
      )
    }

    if (member.learnTags.length > 0) {
      parts.push(
        t("kvintet.members.wantsToLearn", {
          tags: member.learnTags.join(", "),
        }),
      )
    }

    if (member.interestTags.length > 0) {
      parts.push(member.interestTags.join(", "))
    }

    return parts.join(" · ")
  }

  return (
    <ul className="divide-y divide-border">
      {/* Existing members */}
      {members.map((member) => {
        const tagsString = formatMemberTags(member)

        return (
          <li
            key={member.userId}
            className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex flex-col gap-0.5">
              {isActive ? (
                // Active kvintet view: shows full name and role
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {member.name ?? t("kvintet.members.openSeat")}
                    {member.isCurrentUser ? ` ${String(t("kvintet.members.you"))}` : ""}
                  </span>
                  {member.role && (
                    <span className="text-sm text-muted-foreground">{member.role}</span>
                  )}
                </div>
              ) : (
                // Proposal view: shows role (with (vy) indicator for current user)
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {member.role ?? member.name ?? t("kvintet.members.openSeat")}
                    {member.isCurrentUser ? ` ${String(t("kvintet.members.you"))}` : ""}
                  </span>
                </div>
              )}

              {tagsString && <p className="text-sm text-muted-foreground">{tagsString}</p>}
            </div>

            {/* In proposal view: show vote status badge */}
            {!isActive && (
              <div className="shrink-0">
                {member.hasVoted ? (
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs tracking-meta text-primary uppercase">
                    {t("kvintet.members.votedYes")}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs tracking-meta text-muted-foreground uppercase">
                    {t("kvintet.members.notVoted")}
                  </span>
                )}
              </div>
            )}
          </li>
        )
      })}

      {/* Empty seats (only in proposals or underfilled groups) */}
      {!isActive &&
        Array.from({ length: openSeatsCount }, (_, i) => {
          const seatNumber = members.length + i + 1
          const isFifth = seatNumber === 5

          return (
            <li
              key={`open-seat-${i}`}
              className="flex flex-col gap-0.5 py-3.5 opacity-70"
            >
              <span className="text-base font-medium text-muted-foreground">
                {t("kvintet.members.openSeat")}
              </span>
              <p className="text-sm text-muted-foreground">
                {isFifth
                  ? t("kvintet.members.waitingForFifth")
                  : t("kvintet.members.waitingForMember")}
              </p>
            </li>
          )
        })}
    </ul>
  )
}
