import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import {
  useMascotAnchor,
  useMascotContext,
  useMascotStage,
  type MascotAction,
} from "@/components/Mascot/MascotContext"

import { useSession } from "@/features/auth/hooks/useSession"
import { myKvintetQueryOptions } from "@/features/kvintet/api/kvintetApi"
import { kvintetFeedQueryOptions } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { useMarkTourCompleted } from "@/features/profile/hooks/useMarkTourCompleted"

import { resolveTourStep, TOUR_ANCHOR, TOUR_PAGE_ANCHOR, type TourStepKey } from "./tourSteps"

function overviewText(t: TFunction, isMember: boolean, suggestedCount: number): string {
  if (isMember) return t("tour.overviewMember")
  return suggestedCount > 0
    ? t("tour.overview", { count: suggestedCount })
    : t("tour.overviewNoCount")
}

/**
 * Walks a new person through Home, the feed and finally the avatar in the header with the
 * mascot. (Onboarding has its own avatar at the top of every page, see `GuideAvatar`; this only says when
 * the tour is running.) Lives in `app/` because it ties several features together, which
 * features may not do among themselves.
 */
export function TourController() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useSession()
  const replayToken = useMascotContext()?.replayToken ?? 0
  const setStage = useMascotContext()?.setStage
  const setTourActive = useMascotContext()?.setTourActive
  const [pageAnchorRef] = useMascotAnchor(TOUR_PAGE_ANCHOR)
  const location = useRouterState({ select: (state) => state.location })
  const profileQuery = useQuery({ ...profileQueryOptions(user?.id), enabled: Boolean(user) })
  const isOnboarded = Boolean(profileQuery.data?.onboardingCompletedAt)
  // The same queries as Home, so asking again costs nothing. A member's Home shows their own
  // kvintet and the feed is closed to them, so the tour must not send them there.
  const myKvintetQuery = useQuery({ ...myKvintetQueryOptions(), enabled: isOnboarded })
  const isMember = Boolean(myKvintetQuery.data)
  const feedQuery = useQuery({
    ...kvintetFeedQueryOptions(),
    enabled: isOnboarded && myKvintetQuery.isSuccess && !isMember,
  })
  // Home lists at most three; the text says how many there really are.
  const suggestedCount = Math.min(3, feedQuery.data?.items.length ?? 0)
  // Which Home the person has is not known yet: the first words must fit it.
  const isMembershipPending = isOnboarded && myKvintetQuery.isPending
  // `mutate` is stable; the mutation object is not, and the stage below must not change every render.
  const { mutate: markTourDone } = useMarkTourCompleted(user?.id)
  const [isReplay, setIsReplay] = useState(false)
  const [isAtHeader, setIsAtHeader] = useState(false)
  const handledReplay = useRef(0)

  // The menu asks for the tour again: start from Home, nothing is written to the server.
  useEffect(() => {
    if (replayToken === 0 || replayToken === handledReplay.current) return
    handledReplay.current = replayToken
    setIsReplay(true)
    setIsAtHeader(false)
    void navigate({ to: ROUTES.overview })
  }, [replayToken, navigate])

  const profile = profileQuery.data
  // A person with no profile yet has not finished onboarding, so the tour is still ahead of them.
  const isDue = profileQuery.isSuccess && !profile?.tourCompletedAt
  // At the header the tour is already saved as done; it only has its goodbye left to say.
  const isActive = Boolean(user) && (isReplay || isDue || isAtHeader)

  const stepKey = isActive
    ? resolveTourStep({
        pathname: location.pathname,
        isOnboarded: Boolean(profile?.onboardingCompletedAt),
        isAtHeader,
        isReplay,
      })
    : null

  // The header keeps its avatar back until the mascot arrives there at the end.
  useEffect(() => {
    setTourActive?.(isActive)
    return () => setTourActive?.(false)
  }, [isActive, setTourActive])

  const stage = useMemo(() => {
    if (!user || !stepKey || (stepKey === "overview" && isMembershipPending)) return null

    // The mascot flies home to the header. The tour is saved as done right here, not at "Done":
    // a person who walks away from the goodbye must not get the whole tour again.
    const goHome = () => {
      if (!isReplay) markTourDone()
      setIsAtHeader(true)
    }
    const finish = () => {
      setIsReplay(false)
      setIsAtHeader(false)
      setStage?.(null)
    }
    const next = (onClick: () => void): MascotAction => ({ label: t("tour.next"), onClick })
    const actions: Record<TourStepKey, MascotAction[]> = {
      // A member has no feed to see: Next skips that step.
      overview: [next(isMember ? goHome : () => void navigate({ to: ROUTES.kvintetFeed }))],
      feed: [next(goHome)],
      header: [{ label: t("tour.done"), onClick: finish }],
    }

    return {
      anchorId: TOUR_ANCHOR[stepKey],
      // From here on the mascot is this person's own avatar, seeded like the header and the menus.
      seed: user.username || user.id,
      bubble: {
        text:
          stepKey === "overview" ? overviewText(t, isMember, suggestedCount) : t(`tour.${stepKey}`),
        actions: actions[stepKey],
        // The cross ends the tour: nobody has to click through it to be rid of it.
        onClose: stepKey === "header" ? finish : goHome,
      },
    }
  }, [
    user,
    stepKey,
    isReplay,
    isMember,
    isMembershipPending,
    suggestedCount,
    markTourDone,
    setStage,
    navigate,
    t,
  ])
  useMascotStage(stage)

  return (
    <span
      ref={pageAnchorRef}
      aria-hidden
      className="pointer-events-none fixed top-20 right-4 size-14 md:top-24 md:right-8"
    />
  )
}
