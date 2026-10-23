import type { TFunction } from "i18next"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatList } from "@/lib/date"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetCapacity } from "@/features/kvintet/components/KvintetCapacity"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

type Member = FeedKvintet["members"][number]

type KvintetCardProps = {
  kvintet: FeedKvintet
  isJoining: boolean
  // Another join is in flight; the user can only be in one kvintet.
  isDisabled: boolean
  onJoin: (kvintetId: string) => void
}

function describeMember(
  member: Member,
  t: TFunction,
  label: ReturnType<typeof useSlugLabel>,
): string {
  const tags = (slugs: string[]) => formatList(slugs.map((slug) => label("tags", slug)))
  return [
    member.teach.length ? t("kvintet.teaches", { tags: tags(member.teach) }) : null,
    member.learn.length ? t("kvintet.learns", { tags: tags(member.learn) }) : null,
    member.interests.length ? t("kvintet.interests", { tags: tags(member.interests) }) : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

export function KvintetCard({ kvintet, isJoining, isDisabled, onJoin }: KvintetCardProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const freeSeats = Math.max(kvintet.capacity - kvintet.members.length, 0)
  const titleId = `kvintet-${kvintet.id}`

  return (
    <Card
      aria-labelledby={titleId}
      className="gap-4 rounded-lg bg-secondary px-7 py-6"
    >
      <span className="inline-flex self-start rounded-full border border-input px-2.5 py-0.5 font-mono text-xs tracking-meta text-body uppercase">
        {label("categories", kvintet.category)}
      </span>

      <div className="flex items-center justify-between gap-4">
        <h2
          id={titleId}
          className="text-heading font-semibold"
        >
          {kvintet.title}
        </h2>
        <KvintetCapacity
          filled={kvintet.members.length}
          total={kvintet.capacity}
        />
      </div>

      {kvintet.meetingFrequency ? (
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
          {t("kvintet.suitsAll", { value: t(`meetingFrequency.${kvintet.meetingFrequency}`) })}
        </p>
      ) : null}

      <ul>
        {kvintet.members.map((member, index) => (
          <li
            key={index}
            className="flex flex-col gap-1 border-t border-border py-2.5 sm:flex-row sm:items-center sm:gap-4"
          >
            <p className="text-base font-semibold text-foreground sm:w-56 sm:shrink-0">
              {member.position ?? t("kvintet.member")}
            </p>
            <p className="text-sm text-body">{describeMember(member, t, label)}</p>
          </li>
        ))}
        {Array.from({ length: freeSeats }, (_, index) => (
          <li
            key={`free-${index}`}
            className="flex flex-col gap-1 border-t border-border py-2.5 text-muted-foreground sm:flex-row sm:items-center sm:gap-4"
          >
            <p className="text-base font-semibold sm:w-56 sm:shrink-0">{t("kvintet.vacancy")}</p>
            <p className="text-sm">{t("kvintet.vacancyHint")}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
        <Button
          variant="outline"
          className="max-sm:w-full"
          disabled={isDisabled}
          onClick={() => onJoin(kvintet.id)}
        >
          {isJoining ? <Loader2 className="animate-spin" /> : null}
          {t("kvintet.join")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("kvintet.namesHidden")}</p>
      </div>
    </Card>
  )
}
