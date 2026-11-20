import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { happy } from "blobatar/expression"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/errorMessage"

import {
  profileQueryOptions,
  referenceQueryOptions,
  useSaveProfile,
  type ProfileResponse,
  type ReferenceTag,
} from "@/features/profile/api/profileApi"
import { OnboardingAnswers } from "@/features/profile/components/onboarding/OnboardingAnswers"
import { OnboardingFrame } from "@/features/profile/components/onboarding/OnboardingFrame"
import {
  draftFromProfile,
  hasProblem,
  payloadFor,
  type OnboardingDraft,
} from "@/features/profile/lib/onboardingDraft"
import {
  LAST_ONBOARDING_PAGE,
  nextPage,
  PAGE_FOR_MISSING_FIELD,
  previousPage,
  type OnboardingPageId,
} from "@/features/profile/lib/onboardingPages"

type OnboardingFlowProps = {
  userId?: string
  /** The person's avatar seed: username, id when there is none. Never the e-mail. */
  seed?: string
  /** The page lives in the URL (the header shows its step too), so the route owns it. */
  page: OnboardingPageId
  onPageChange: (page: OnboardingPageId) => void
}

/** Pages that only have a question when the required answer is there; the others can be left empty. */
const PAGES_WITH_ERROR = ["role", "days", "time", "place", "frequency", "note"] as const
type PageWithError = (typeof PAGES_WITH_ERROR)[number]
const hasErrorText = (page: OnboardingPageId): page is PageWithError =>
  (PAGES_WITH_ERROR as readonly string[]).includes(page)

// The API client puts the server's `{ code }` body on `error.data` (see `lib/api-client.ts`).
const serverCodeOf = (error: unknown) => (error as { data?: { code?: unknown } } | null)?.data?.code

export function OnboardingFlow({ userId, seed, page, onPageChange }: OnboardingFlowProps) {
  const referenceQuery = useQuery(referenceQueryOptions())
  const profileQuery = useQuery(profileQueryOptions(userId))

  if (referenceQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 py-8">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (referenceQuery.isError || profileQuery.isError) {
    return (
      <Alert
        variant="destructive"
        className="my-8"
      >
        <AlertDescription>
          {getErrorMessage(referenceQuery.error ?? profileQuery.error)}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <OnboardingFlowPages
      userId={userId}
      seed={seed}
      page={page}
      onPageChange={onPageChange}
      profile={profileQuery.data ?? null}
      allTags={referenceQuery.data?.tags ?? []}
      categories={referenceQuery.data?.categories ?? []}
    />
  )
}

type OnboardingFlowPagesProps = OnboardingFlowProps & {
  profile: ProfileResponse
  allTags: ReferenceTag[]
  categories: { slug: string }[]
}

function OnboardingFlowPages({
  userId,
  seed,
  page,
  onPageChange,
  profile,
  allTags,
  categories,
}: OnboardingFlowPagesProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const saveProfile = useSaveProfile(userId)

  // The draft starts as the saved profile, and each Continue saves the page's answers.
  const [draft, setDraft] = useState<OnboardingDraft>(() => draftFromProfile(profile))
  // The page that shows its error, and a counter the avatar shakes its head to.
  const [errorPage, setErrorPage] = useState<OnboardingPageId | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)

  const showError = (target: OnboardingPageId) => {
    setErrorPage(target)
    setShakeKey((key) => key + 1)
  }

  const goTo = (target: OnboardingPageId) => {
    setErrorPage(null)
    setSaveError(null)
    onPageChange(target)
  }

  const handleContinue = async () => {
    if (hasProblem(page, draft)) {
      showError(page)
      return
    }

    setSaveError(null)
    const payload = payloadFor(page, draft)
    if (payload) {
      try {
        await saveProfile.mutateAsync(payload)
      } catch (error) {
        // The server found a required answer missing (say, a profile edited elsewhere): take the
        // person to that question, showing what is missing.
        const code = serverCodeOf(error)
        const missing = typeof code === "string" ? PAGE_FOR_MISSING_FIELD[code] : undefined
        if (missing) {
          onPageChange(missing)
          showError(missing)
        } else {
          setSaveError(getErrorMessage(error))
        }
        return
      }
    }

    const next = nextPage(page)
    if (next) goTo(next)
    else await navigate({ to: ROUTES.overview })
  }

  const previous = previousPage(page)
  const error =
    errorPage === page && hasErrorText(page)
      ? {
          hint: t(`onboarding.guide.${page}.error`),
          problem: t(`onboarding.guide.${page}.problem`),
        }
      : null

  // Until a place is picked there is no pin to drag, so the map's hint says what to do first.
  const hint =
    page === "place" && draft.latitude === null
      ? t("onboarding.guide.place.hintBeforePick")
      : t(`onboarding.guide.${page}.hint`)

  const continueLabel =
    page === "summary"
      ? t("onboarding.summary.next")
      : page === LAST_ONBOARDING_PAGE
        ? t("common.finish")
        : t("common.continue")

  return (
    <OnboardingFrame
      page={page}
      seed={seed}
      title={t(`onboarding.guide.${page}.title`)}
      hint={hint}
      error={error}
      saveError={saveError}
      expression={page === "summary" ? happy : undefined}
      shakeKey={shakeKey}
      onBack={previous ? () => goTo(previous) : undefined}
      onContinue={() => void handleContinue()}
      continueLabel={continueLabel}
      isSaving={saveProfile.isPending}
    >
      <OnboardingAnswers
        key={page}
        page={page}
        draft={draft}
        onChange={(patch) => {
          setDraft((current) => ({ ...current, ...patch }))
          // The person is answering: the error has done its job.
          if (errorPage === page) setErrorPage(null)
        }}
        allTags={allTags}
        categories={categories}
        onEdit={goTo}
      />
    </OnboardingFrame>
  )
}
