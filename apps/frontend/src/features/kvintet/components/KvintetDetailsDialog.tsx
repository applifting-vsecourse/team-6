import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AnonymousBlobatar } from "@/components/AnonymousBlobatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatList, formatNumber } from "@/lib/date"
import { cn } from "@/lib/utils"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { KvintetDescription } from "@/features/kvintet/components/KvintetDescription"
import { formatSharedPreferences } from "@/features/kvintet/lib/formatPreferences"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

type KvintetDetailsDialogProps = {
  kvintet: FeedKvintet
  isJoining: boolean
  isDisabled: boolean
  onJoin: (kvintetId: string) => void
  /** Classes for the button that opens it. */
  triggerClassName?: string
}

/**
 * A phone has no room for each member's role and tags inside an offer card, so the card shows this
 * button instead of Join: a bottom sheet with the members and the Join button.
 */
export function KvintetDetailsDialog({
  kvintet,
  isJoining,
  isDisabled,
  onJoin,
  triggerClassName,
}: KvintetDetailsDialogProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const shared = formatSharedPreferences(kvintet, t)
  const subtitle = [
    ...kvintet.categories.map((slug) => label("categories", slug)),
    t("kvintet.seatCount", {
      filled: formatNumber(kvintet.members.length),
      total: formatNumber(kvintet.capacity),
    }),
  ].join(" · ")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-11", triggerClassName)}
        >
          {t("kvintet.seeDetails")}
        </Button>
      </DialogTrigger>
      <DialogContent
        isBottomSheet
        className="max-sm:gap-4 max-sm:p-4 max-sm:pt-3"
      >
        <DialogHeader className="gap-1 text-left">
          <DialogDescription className="font-mono text-meta tracking-meta text-muted-foreground uppercase">
            {subtitle}
          </DialogDescription>
          <DialogTitle className="text-subheading leading-tight font-semibold">
            {kvintet.title}
          </DialogTitle>
        </DialogHeader>

        <KvintetDescription text={kvintet.description} />
        {shared ? (
          <p className="text-compact text-muted-foreground">
            {t("overview.commonTime")} <span className="font-medium text-foreground">{shared}</span>
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          <h3 className="text-h3 font-semibold">{t("kvintet.detail.members")}</h3>
          <ul className="flex flex-col divide-y divide-border">
            {kvintet.members.map((member, index) => {
              const lines = [
                { heading: t("kvintet.members.teaches"), slugs: member.teach },
                { heading: t("kvintet.members.wantsToLearn"), slugs: member.learn },
                { heading: t("kvintet.members.interests"), slugs: member.interests },
              ].filter((line) => line.slugs.length > 0)
              return (
                <li
                  key={index}
                  className="flex items-start gap-3 py-3"
                >
                  {/* The feed never carries a name, so the face is seeded by the seat. */}
                  <AnonymousBlobatar
                    seed={`${kvintet.id}-seat-${index}`}
                    motion="hover"
                    className="size-8 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col">
                    <p className="text-compact font-medium text-foreground">
                      {member.position ?? t("kvintet.member")}
                    </p>
                    {lines.map(({ heading, slugs }) => (
                      <p
                        key={heading}
                        className="text-small text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">{heading} </span>
                        {formatList(slugs.map((slug) => label("tags", slug)))}
                      </p>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <DialogFooter>
          <Button
            className="h-11"
            disabled={isDisabled}
            onClick={() => onJoin(kvintet.id)}
          >
            {isJoining ? <Loader2 className="animate-spin" /> : null}
            {t("kvintet.join")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
