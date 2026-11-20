import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { KvintetSeats } from "@/components/KvintetSeats"
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
import { formatNumber } from "@/lib/date"
import { cn } from "@/lib/utils"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"
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
 * A phone has no room for the people inside an offer card, so the card shows this button instead
 * of them and of Join: a bottom sheet with who is in the kvintet and the Join button.
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
          {t("kvintet.view")}
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

        {/* The feed never carries a name, so the faces are grey and seeded by the seat. */}
        <KvintetSeats
          layout="row"
          freeLabel={t("kvintet.vacancy")}
          members={kvintet.members.map((member, index) => ({
            seed: `${kvintet.id}-seat-${index}`,
            anonymous: true,
            label: member.position ?? t("kvintet.member"),
          }))}
        />

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
