import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import {
  useMascotAnchor,
  useMascotContext,
  useMascotStage,
  type MascotAction,
} from "@/components/Mascot/MascotContext"

import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { useMarkTourCompleted } from "@/features/profile/hooks/useMarkTourCompleted"

import { resolveTourStep, TOUR_ANCHOR, TOUR_PAGE_ANCHOR, type TourStepKey } from "./tourSteps"

/**
 * Walks a new person through Home, the feed and finally the avatar in the header with the
 * mascot. (Onboarding is guided by its own cards, see `useOnboardingGuide`; this only says when
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
  const isActive = Boolean(user) && (isReplay || isDue)

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
    if (!user || !stepKey) return null

    const finish = () => {
      if (!isReplay) markTourDone()
      setIsReplay(false)
      setIsAtHeader(false)
      setStage?.(null)
    }
    const next = (onClick: () => void): MascotAction => ({ label: t("tour.next"), onClick })
    const actions: Record<TourStepKey, MascotAction[]> = {
      overview: [next(() => void navigate({ to: ROUTES.kvintetFeed }))],
      feed: [next(() => setIsAtHeader(true))],
      header: [{ label: t("tour.done"), onClick: finish }],
    }

    return {
      anchorId: TOUR_ANCHOR[stepKey],
      // From here on the mascot is this person's own avatar, seeded like the header and the menus.
      seed: user.username || user.id,
      bubble: { text: t(`tour.${stepKey}`), actions: actions[stepKey], isClosable: true },
    }
  }, [user, stepKey, isReplay, markTourDone, setStage, navigate, t])
  useMascotStage(stage)

  return (
    <span
      ref={pageAnchorRef}
      aria-hidden
      className="pointer-events-none fixed top-20 right-4 size-14 md:top-24 md:right-8"
    />
  )
}
