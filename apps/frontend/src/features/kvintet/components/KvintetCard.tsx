import { Fragment } from "react"
import type { TFunction } from "i18next"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AnonymousBlobatar, FreeSeat } from "@/components/AnonymousBlobatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatNumber } from "@/lib/date"

import type { FeedKvintet, FeedReason } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

type KvintetCardProps = {
  kvintet: FeedKvintet
  isJoining: boolean
  // Another join is in flight; the user can only be in one kvintet.
  isDisabled: boolean
  onJoin: (kvintetId: string) => void
}

function describeReason(
  reason: FeedReason,
  t: TFunction,
  label: ReturnType<typeof useSlugLabel>,
): string {
  switch (reason.code) {
    case "learn":
    case "teach":
    case "interest":
      return t(`kvintet.reasons.${reason.code}`, { tag: label("tags", reason.tag) })
    case "topic":
      return t("kvintet.reasons.topic", { category: label("categories", reason.category) })
    default:
      return t(`kvintet.reasons.${reason.code}`)
  }
}

export function KvintetCard({ kvintet, isJoining, isDisabled, onJoin }: KvintetCardProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const freeSeats = Math.max(kvintet.capacity - kvintet.members.length, 0)
  const titleId = `kvintet-${kvintet.id}`
  const seatCount = t("kvintet.seatCount", {
    filled: formatNumber(kvintet.members.length),
    total: formatNumber(kvintet.capacity),
  })

  return (
    <Card
      aria-labelledby={titleId}
      className="gap-4.5 rounded-lg px-4.5 py-4.5 sm:px-6 sm:py-6"
    >
      {/* Desktop: title, category pills, seat count on the right. Mobile: one mono line above the
          title ("TECHNOLOGY · 3 / 5"); `sm:contents` hands the pieces to the row on desktop. */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
        <h2
          id={titleId}
          className="text-h3 font-semibold"
        >
          {kvintet.title}
        </h2>
        <div className="order-first flex flex-wrap gap-x-1.5 font-mono text-meta tracking-meta text-muted-foreground uppercase sm:contents">
          {kvintet.categories.map((slug) => (
            <Fragment key={slug}>
              <span className="sm:rounded-full sm:border sm:border-input sm:px-2.5 sm:py-0.75 sm:font-sans sm:text-small sm:tracking-normal sm:normal-case">
                {label("categories", slug)}
              </span>
              <span
                aria-hidden
                className="sm:hidden"
              >
                ·
              </span>
            </Fragment>
          ))}
          <span className="sm:ml-auto">{seatCount}</span>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-3.5 gap-y-4 sm:gap-x-7">
        {kvintet.members.map((member, index) => (
          <li
            key={index}
            className="flex flex-col items-center gap-1.5 text-small text-foreground"
          >
            {/* The feed never carries a name, so the face is seeded by the seat, not the person. */}
            <AnonymousBlobatar
              seed={`${kvintet.id}-seat-${index}`}
              className="size-12 shrink-0"
              motion="hover"
            />
            <span className="max-w-24 text-center">{member.position ?? t("kvintet.member")}</span>
          </li>
        ))}
        {Array.from({ length: freeSeats }, (_, index) => (
          <li
            key={`free-${index}`}
            className="flex flex-col items-center gap-1.5 text-small text-muted-foreground"
          >
            <span className="grid size-12 place-items-center">
              <FreeSeat className="size-9" />
            </span>
            <span>{t("kvintet.vacancy")}</span>
          </li>
        ))}
      </ul>

      {kvintet.reasons.length ? (
        <p className="text-small text-body">
          <span className="sr-only">{t("kvintet.reasons.label")} </span>
          {kvintet.reasons.map((reason) => describeReason(reason, t, label)).join(" · ")}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 sm:border-t sm:border-border sm:pt-4">
        {kvintet.meetingFrequency ? (
          <p className="text-small text-muted-foreground sm:flex-1">
            {t(`kvintet.frequency.${kvintet.meetingFrequency}`)}
          </p>
        ) : (
          <span className="sm:flex-1" />
        )}
        <Button
          variant="outline"
          className="h-11 max-sm:w-full"
          disabled={isDisabled}
          onClick={() => onJoin(kvintet.id)}
        >
          {isJoining ? <Loader2 className="animate-spin" /> : null}
          {t("kvintet.join")}
        </Button>
      </div>
    </Card>
  )
}
