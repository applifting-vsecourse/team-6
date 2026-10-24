import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Trans, useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import watermark from "@/assets/logo-watermark.svg"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { formatLongDate } from "@/lib/date"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { useKvintetMembership } from "@/features/kvintet/hooks/useKvintetMembership"
import { profileQueryOptions, type Tag } from "@/features/profile/api/profileApi"
import { TagBadge } from "@/features/profile/components/TagBadge"

export const Route = createFileRoute("/_ProtectedPages/overview")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    const profile = await context.queryClient.ensureQueryData(
      profileQueryOptions(session?.user?.id),
    )
    if (!profile?.onboardingCompletedAt) {
      throw redirect({ to: ROUTES.onboarding })
    }
  },
  component: OverviewPage,
})

function OverviewPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const profileQuery = useQuery(profileQueryOptions(user?.id))
  const profile = profileQuery.data
  const { isMember } = useKvintetMembership()

  const nextStep = isMember
    ? {
        badge: t("overview.nextStepMember.badge"),
        title: t("overview.nextStepMember.title"),
        description: t("overview.nextStepMember.description"),
        button: t("overview.nextStepMember.button"),
        to: ROUTES.myKvintet,
      }
    : {
        badge: t("overview.nextStep.badge"),
        title: t("overview.nextStep.title"),
        description: t("overview.nextStep.description"),
        button: t("overview.nextStep.button"),
        to: ROUTES.kvintetFeed,
      }

  const firstName = user?.name.split(" ")[0]

  const getTagLabel = (tag: Tag): string => {
    const key = `tags.${tag.slug}`
    const translated = (t as (k: string) => string)(key)
    return translated === key ? tag.slug : translated
  }

  const getSummaryLine = () => {
    if (!profile) return null

    const parts: string[] = []
    if (profile.cityName) {
      parts.push(profile.cityName)
    }

    const times: string[] = []
    if (profile.evenings) times.push(t("overview.profileCard.timeEvenings"))
    if (profile.afternoons) times.push(t("overview.profileCard.timeAfternoons"))
    if (profile.mornings) times.push(t("overview.profileCard.timeMornings"))
    if (times.length > 0) {
      parts.push(times.join(", "))
    } else {
      const days: string[] = []
      if (profile.weekdays) days.push(t("overview.profileCard.daysWeekdays"))
      if (profile.weekends) days.push(t("overview.profileCard.daysWeekends"))
      if (days.length > 0) parts.push(days.join(", "))
    }

    if (profile.meetingFrequency === "WEEKLY") {
      parts.push(t("overview.profileCard.frequencyWeekly"))
    } else if (profile.meetingFrequency === "BIWEEKLY") {
      parts.push(t("overview.profileCard.frequencyBiweekly"))
    } else if (profile.meetingFrequency === "MONTHLY") {
      parts.push(t("overview.profileCard.frequencyMonthly"))
    }

    return parts.length > 0 ? parts.join(" · ") : null
  }

  const summaryLine = getSummaryLine()

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="relative mx-auto w-full max-w-4xl px-4 pt-16 pb-24">
        <img
          src={watermark}
          alt=""
          width={182}
          height={182}
          className="pointer-events-none absolute top-2 right-4 hidden size-45.5 md:block"
        />
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
            {formatLongDate(new Date())}
          </p>
          <h1 className="text-title">
            {firstName ? (
              <Trans
                i18nKey="overview.greeting"
                values={{ name: firstName }}
                components={{ em: <em /> }}
              />
            ) : (
              t("overview.greetingAnonymous")
            )}
          </h1>
          <p className="text-lg text-foreground/80">
            {isMember ? t("overview.subtitleMember") : t("overview.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-3">
          {/* Next step block */}
          <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-background p-8 md:col-span-2">
            <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
              {nextStep.badge}
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground">{nextStep.title}</h2>
            <p className="text-base text-foreground/80">{nextStep.description}</p>
            <div className="pt-1">
              <Button asChild>
                <Link to={nextStep.to}>{nextStep.button}</Link>
              </Button>
            </div>
            {!isMember && (
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-5">
                <p className="text-sm text-foreground/80">{t("overview.howItWorks.p1")}</p>
                <p className="text-sm text-foreground/80">{t("overview.howItWorks.p2")}</p>
                <p className="text-sm text-foreground/80">{t("overview.howItWorks.p3")}</p>
              </div>
            )}
          </div>

          {/* Profile side card */}
          <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-background p-6">
            <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
              {t("overview.profileCard.badge")}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {profile?.roles && profile.roles.length > 0 ? (
                profile.roles.map((r) => (
                  <TagBadge
                    key={r}
                    label={(t as (k: string, opts?: { defaultValue?: string }) => string)(
                      `roles.${r}`,
                      { defaultValue: r },
                    )}
                    variant="readOnly"
                  />
                ))
              ) : profile?.position ? (
                <TagBadge
                  label={(t as (k: string, opts?: { defaultValue?: string }) => string)(
                    `roles.${profile.position}`,
                    { defaultValue: profile.position },
                  )}
                  variant="readOnly"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("overview.profileCard.noPosition")}
                </span>
              )}
            </div>

            {profile && profile.teaches.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-sm text-muted-foreground">
                  {t("overview.profileCard.teaches")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.teaches.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      label={getTagLabel(tag)}
                      variant="readOnly"
                    />
                  ))}
                </div>
              </div>
            )}

            {profile && profile.learns.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-sm text-muted-foreground">
                  {t("overview.profileCard.learns")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.learns.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      label={getTagLabel(tag)}
                      variant="readOnly"
                    />
                  ))}
                </div>
              </div>
            )}

            {profile && profile.interests.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-sm text-muted-foreground">
                  {t("overview.profileCard.interests")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      label={getTagLabel(tag)}
                      variant="readOnly"
                    />
                  ))}
                </div>
              </div>
            )}

            {summaryLine && <p className="pt-2 text-sm text-muted-foreground">{summaryLine}</p>}

            <div className="pt-1">
              <Link
                to={ROUTES.onboarding}
                className="text-label font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                {t("overview.profileCard.edit")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
