import { ROUTES } from "@/app/routes"

export type TourStepKey = "overview" | "feed" | "header"

type TourState = {
  pathname: string
  isOnboarded: boolean
  /** The pages are done and the mascot is flying home to the header. */
  isAtHeader: boolean
  /** Started from the menu: the person has already been through onboarding. */
  isReplay: boolean
}

/**
 * Where the mascot stands on the tour, from the page the person is on. `null`: it stays out of the
 * way. Onboarding is not here: its own cards drive the mascot (`useOnboardingGuide`).
 */
export function resolveTourStep({
  pathname,
  isOnboarded,
  isAtHeader,
  isReplay,
}: TourState): TourStepKey | null {
  if (pathname === ROUTES.onboarding) return null
  if (!isOnboarded && !isReplay) return null
  if (isAtHeader) return "header"
  if (pathname === ROUTES.overview) return "overview"
  if (pathname === ROUTES.kvintetFeed) return "feed"
  return null
}

/**
 * A slot fixed to the window, top right under the header. On Home and the feed the mascot waits
 * there: those pages have no card of their own to stick to, and the slot never scrolls away.
 */
export const TOUR_PAGE_ANCHOR = "tour-page"

/** Where each step puts the mascot. */
export const TOUR_ANCHOR: Record<TourStepKey, string> = {
  overview: TOUR_PAGE_ANCHOR,
  feed: TOUR_PAGE_ANCHOR,
  header: "header-avatar",
}
