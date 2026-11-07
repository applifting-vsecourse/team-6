import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/errorMessage"
import { useSlugLabel } from "@/lib/useSlugLabel"

import { DeleteAccountDialog } from "@/features/account/components/DeleteAccountDialog"
import { useDeleteAccount } from "@/features/account/hooks/useDeleteAccount"
import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions, type ProfileResponse } from "@/features/profile/api/profileApi"
import { TagBadge } from "@/features/profile/components/TagBadge"
import { useProfile } from "@/features/profile/hooks/useProfile"

export function formatWhenAndWhere(
  profile: ProfileResponse | null | undefined,
  t: TFunction,
): string | null {
  if (!profile) return null

  // 1. Days and times
  const hasWeekdays = profile.weekdays
  const hasWeekends = profile.weekends

  let daysStr = ""
  if (hasWeekdays && hasWeekends) {
    daysStr = t("profile.when.allDays")
  } else if (hasWeekdays) {
    daysStr = t("profile.when.weekdays")
  } else if (hasWeekends) {
    daysStr = t("profile.when.weekends")
  }

  const timesList: string[] = []
  if (profile.mornings) timesList.push(t("profile.when.mornings"))
  if (profile.afternoons) timesList.push(t("profile.when.afternoons"))
  if (profile.evenings) timesList.push(t("profile.when.evenings"))

  let timePart = ""
  if (daysStr && timesList.length > 0) {
    timePart = `${daysStr} ${timesList.join(", ")}`
  } else if (daysStr) {
    timePart = daysStr
  } else if (timesList.length > 0) {
    timePart = timesList.join(", ")
  }

  // 2. City and radius
  let placePart = ""
  if (profile.cityName) {
    if (profile.radiusKm !== null && profile.radiusKm !== undefined && profile.radiusKm > 0) {
      placePart = `${profile.cityName}, ${t("profile.withinRadius", { count: profile.radiusKm })}`
    } else {
      placePart = profile.cityName
    }
  }

  // 3. Frequency
  let freqPart = ""
  if (profile.meetingFrequency) {
    freqPart = t(`meetingFrequency.${profile.meetingFrequency}`)
  }

  const parts = [timePart, placePart, freqPart].filter(Boolean)
  if (parts.length === 0) return null
  return parts.join(" · ")
}

export const Route = createFileRoute("/_ProtectedPages/profile")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session?.user?.id) {
      await context.queryClient.ensureQueryData(profileQueryOptions(session.user.id))
    }
  },
  component: ProfileRoute,
})

function ProfileRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("profile.title")} />
      <ProfilePage />
    </>
  )
}

export type ProfilePageProps = {
  user?: {
    id: string
    name?: string
    username?: string
  } | null
}

export function ProfilePage({ user: propUser }: ProfilePageProps = {}) {
  const { t } = useTranslation()
  const session = useSession()
  const user = propUser !== undefined ? propUser : session.user
  const label = useSlugLabel()
  const { profile, isLoading, isError, error, refetch } = useProfile(user?.id)
  const deleteAccount = useDeleteAccount()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-7 pb-10 md:py-12 md:pb-22">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:p-7">
          <Skeleton className="size-[88px] rounded-full md:size-24" />
          <div className="flex flex-1 flex-col items-center gap-2 md:items-start">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-7 md:py-12">
        <Alert variant="destructive">
          <AlertTitle>{t("profile.error.title")}</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-4">
            <span>{getErrorMessage(error)}</span>
            <Button
              variant="outline"
              onClick={() => void refetch()}
            >
              {t("common.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // An empty username falls back to the id, matching HeaderMenu and onboarding.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const seed = user?.username || user?.id || "user"
  const displayName = user?.name ?? ""

  // Subtitle: @username · role/position
  const roleText =
    profile?.position ??
    (profile?.roles && profile.roles.length > 0
      ? profile.roles.map((r) => label("roles", r)).join(", ")
      : undefined)

  const subtitleParts = [user?.username ? `@${user.username}` : undefined, roleText].filter(Boolean)
  const subtitle = subtitleParts.join(" · ")

  const whenAndWhere = formatWhenAndWhere(profile, t) ?? t("profile.empty.whenAndWhere")

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-7 pb-10 md:py-12 md:pb-22">
      {/* 1. Identity section */}
      <section className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center md:flex-row md:gap-6 md:p-7 md:text-left">
        <GazeBlobatar
          name={seed}
          title={displayName}
          animate="always"
          className="size-[88px] shrink-0 md:size-24"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-h1-mobile font-semibold tracking-tight text-foreground md:text-h1">
            {displayName}
          </h1>
          {subtitle ? (
            <p className="text-compact text-muted-foreground md:text-lead">{subtitle}</p>
          ) : null}
          <p className="hidden text-small text-muted-foreground md:block">
            {t("profile.newUsernameHint")}
          </p>
        </div>
      </section>

      {/* 2. I can teach (Umím naučit) */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 md:gap-3 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">{t("profile.sections.teach")}</h2>
          <Button
            asChild
            variant="ghost"
            className="h-auto p-0 text-label font-medium text-foreground hover:bg-transparent hover:text-muted-foreground md:px-4.5 md:py-2.75"
          >
            <Link
              to={ROUTES.onboarding}
              search={{ step: 1 }}
            >
              {t("common.edit")}
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.teaches && profile.teaches.length > 0 ? (
            profile.teaches.map((tag) => (
              <TagBadge
                key={tag.id}
                label={label("tags", tag.slug)}
                variant="readOnly"
              />
            ))
          ) : (
            <p className="text-small text-muted-foreground">{t("profile.empty.teach")}</p>
          )}
        </div>
      </section>

      {/* 3. I want to learn (Chci se naučit) */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 md:gap-3 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">{t("profile.sections.learn")}</h2>
          <Button
            asChild
            variant="ghost"
            className="h-auto p-0 text-label font-medium text-foreground hover:bg-transparent hover:text-muted-foreground md:px-4.5 md:py-2.75"
          >
            <Link
              to={ROUTES.onboarding}
              search={{ step: 1 }}
            >
              {t("common.edit")}
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.learns && profile.learns.length > 0 ? (
            profile.learns.map((tag) => (
              <TagBadge
                key={tag.id}
                label={label("tags", tag.slug)}
                variant="readOnly"
              />
            ))
          ) : (
            <p className="text-small text-muted-foreground">{t("profile.empty.learn")}</p>
          )}
        </div>
      </section>

      {/* 4. I'm interested in (Zajímá mě) */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 md:gap-3 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">
            {t("profile.sections.interests")}
          </h2>
          <Button
            asChild
            variant="ghost"
            className="h-auto p-0 text-label font-medium text-foreground hover:bg-transparent hover:text-muted-foreground md:px-4.5 md:py-2.75"
          >
            <Link
              to={ROUTES.onboarding}
              search={{ step: 1 }}
            >
              {t("common.edit")}
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.interests && profile.interests.length > 0 ? (
            profile.interests.map((tag) => (
              <TagBadge
                key={tag.id}
                label={label("tags", tag.slug)}
                variant="readOnly"
              />
            ))
          ) : (
            <p className="text-small text-muted-foreground">{t("profile.empty.interests")}</p>
          )}
        </div>
      </section>

      {/* 5. When and where (Kdy a kde) */}
      <section className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 md:gap-1.5 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold text-foreground">
            {t("profile.sections.whenAndWhere")}
          </h2>
          <Button
            asChild
            variant="ghost"
            className="h-auto p-0 text-label font-medium text-foreground hover:bg-transparent hover:text-muted-foreground md:px-4.5 md:py-2.75"
          >
            <Link
              to={ROUTES.onboarding}
              search={{ step: 2 }}
            >
              {t("common.edit")}
            </Link>
          </Button>
        </div>
        <p className="text-compact text-muted-foreground md:text-body">{whenAndWhere}</p>
      </section>

      {/* 6. Danger zone (Delete account) */}
      <section className="flex flex-col items-start gap-2.5 border-t border-border pt-5 md:pt-6">
        <h2 className="text-h3 font-semibold text-foreground">{t("profile.dangerZone.title")}</h2>
        <p className="text-small text-muted-foreground md:text-compact">
          {t("profile.dangerZone.description")}
        </p>
        <Button
          variant="outline"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="mt-1 w-full sm:w-auto"
        >
          {t("profile.dangerZone.button")}
        </Button>
      </section>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => deleteAccount.mutate()}
        isDeleting={deleteAccount.isPending}
        avatarSeed={seed}
      />
    </div>
  )
}
