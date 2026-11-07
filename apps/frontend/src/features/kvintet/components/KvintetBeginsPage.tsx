import { useEffect } from "react"
import { Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { KvintetSeats, type SeatMember } from "@/components/KvintetSeats"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDayAndMonth, formatTime } from "@/lib/date"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"
import { useMarkBeginsSeen } from "@/features/kvintet/hooks/useMarkBeginsSeen"
import { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"

const TITLE_KEYS = { 3: "three", 4: "four", 5: "five" } as const

/** You first (the seat at the top), then the others in the order the server sent them. */
function toSeats(
  members: KvintetMember[],
  you: string,
  fallback: (number: number) => string,
): SeatMember[] {
  const ordered = [...members].sort((a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser))
  return ordered.map((member, index) => {
    // `find(Boolean)` rather than `??`: an empty or blank name must fall through too.
    const name =
      [member.name?.trim().split(/\s+/)[0], member.role].find(Boolean) ?? fallback(index + 1)
    return {
      seed: member.username ?? member.userId,
      label: member.isCurrentUser ? `${name} ${you}` : name,
    }
  })
}

export function KvintetBeginsPage() {
  const { t } = useTranslation()
  const { data: kvintet, isLoading, isError, refetch } = useMyKvintet()
  const isActive = kvintet?.status === "ACTIVE"
  const hasSeen = kvintet?.beginsSeen
  const { mutate: markSeen } = useMarkBeginsSeen()

  useEffect(() => {
    if (isActive && hasSeen === false) markSeen()
  }, [isActive, hasSeen, markSeen])

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-300 flex-col items-center gap-5 px-4 pt-7 pb-10 md:pt-14 md:pb-22">
        <Skeleton className="h-3 w-48 rounded-full" />
        <Skeleton className="h-14 w-full max-w-lg rounded-md" />
        <Skeleton className="size-68 rounded-full md:size-89" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h2 className="text-subheading text-destructive">{t("errors.somethingWentWrong")}</h2>
        <p className="text-body text-muted-foreground">{t("errors.internal_error")}</p>
        <Button
          variant="outline"
          onClick={() => void refetch()}
        >
          {t("common.reload")}
        </Button>
      </div>
    )
  }

  // Nothing has begun: no kvintet, or still forming.
  if (!kvintet || !isActive) {
    return (
      <Navigate
        to={ROUTES.myKvintet}
        replace
      />
    )
  }

  const count = kvintet.members.length
  // Members can leave an ACTIVE kvintet, so a smaller group gets a title that names no number.
  const titleKey = TITLE_KEYS[count as keyof typeof TITLE_KEYS] ?? "other"
  const startedAt = kvintet.activatedAt ?? kvintet.createdAt

  return (
    <>
      <Seo title={t(`kvintet.begins.title.${titleKey}`)} />
      <div className="mx-auto flex w-full max-w-300 flex-col items-center gap-5 px-4 pt-7 pb-10 text-center md:pt-14 md:pb-22">
        <p className="font-mono text-meta tracking-meta text-highlight uppercase">
          {/* The date is left out on a phone, as in M9. */}
          <span className="max-md:hidden">
            {t("kvintet.begins.dateAt", {
              date: formatDayAndMonth(startedAt),
              time: formatTime(startedAt),
            })}{" "}
          </span>
          {count === 5 ? t("kvintet.begins.eyebrowFive") : t("kvintet.begins.eyebrowStarted")}
        </p>
        <h1 className="text-hero-mobile text-balance md:text-hero">
          {t(`kvintet.begins.title.${titleKey}`)}
        </h1>
        <p className="text-compact text-muted-foreground md:text-lead">
          {t("kvintet.begins.lead")}
        </p>

        {/* The Figma table is taller than the ring: its top seat overhangs it, names hang below. */}
        <div className="mt-1 mb-6 w-68 md:-mt-1.5 md:mb-2.5 md:w-89">
          <KvintetSeats
            hasGuide={false}
            className="[--seat-radius:36.5%] [--seat:26.5%] md:[--seat-radius:36.5%] md:[--seat:27%]"
            members={toSeats(kvintet.members, t("kvintet.members.you"), (number) =>
              t("kvintet.diagram.memberNumber", { number }),
            )}
          />
        </div>

        <p className="text-h2 font-semibold text-foreground max-md:hidden">{kvintet.title}</p>

        <div className="flex w-full flex-col gap-5 md:w-auto md:flex-row md:gap-3">
          <Button asChild>
            <Link to={ROUTES.kvintetMessages}>{t("kvintet.begins.messageGroup")}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
          >
            <Link to={ROUTES.myKvintet}>{t("kvintet.begins.seeMembers")}</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
