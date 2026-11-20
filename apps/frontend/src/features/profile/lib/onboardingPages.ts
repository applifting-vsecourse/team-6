/**
 * The onboarding is one question per page, in three steps (Figma #126). This is the single place
 * that knows the pages and their order: progress, header, navigation and saving all read it.
 */
export const ONBOARDING_PAGES = [
  { id: "role", step: 1, isRequired: true },
  { id: "teach", step: 1, isRequired: false },
  { id: "learn", step: 1, isRequired: false },
  { id: "interests", step: 1, isRequired: false },
  // Not a question: a look back at step 1 before the next one.
  { id: "summary", step: 1, isRequired: false },
  { id: "days", step: 2, isRequired: true },
  { id: "time", step: 2, isRequired: true },
  { id: "place", step: 2, isRequired: true },
  { id: "expectations", step: 3, isRequired: false },
  { id: "frequency", step: 3, isRequired: true },
  { id: "note", step: 3, isRequired: false },
] as const

export type OnboardingPageId = (typeof ONBOARDING_PAGES)[number]["id"]
export type OnboardingStep = 1 | 2 | 3

export const ONBOARDING_TOTAL_STEPS = 3
export const FIRST_ONBOARDING_PAGE: OnboardingPageId = "role"
export const LAST_ONBOARDING_PAGE: OnboardingPageId = "note"
export const ONBOARDING_PAGE_IDS = ONBOARDING_PAGES.map((page) => page.id) as [
  OnboardingPageId,
  ...OnboardingPageId[],
]

const indexOf = (id: OnboardingPageId) => ONBOARDING_PAGES.findIndex((page) => page.id === id)

/** Where a step begins: what the profile page's "Edit" of a section opens. */
export const firstPageOfStep = (step: OnboardingStep): OnboardingPageId =>
  ONBOARDING_PAGES.find((page) => page.step === step)!.id

export const pageOf = (id: OnboardingPageId) => ONBOARDING_PAGES[indexOf(id)]!

export const previousPage = (id: OnboardingPageId): OnboardingPageId | undefined =>
  ONBOARDING_PAGES[indexOf(id) - 1]?.id

export const nextPage = (id: OnboardingPageId): OnboardingPageId | undefined =>
  ONBOARDING_PAGES[indexOf(id) + 1]?.id

/** The page that asks for a profile field the server found missing. */
export const PAGE_FOR_MISSING_FIELD: Record<string, OnboardingPageId> = {
  PROFILE_ROLE_REQUIRED: "role",
  PROFILE_AVAILABILITY_REQUIRED: "days",
  PROFILE_LOCATION_REQUIRED: "place",
  PROFILE_FREQUENCY_REQUIRED: "frequency",
}

export type OnboardingProgress = {
  step: OnboardingStep
  /** Which question of the step this is, and how many it has. `null` on the summary. */
  position: { current: number; total: number } | null
  /** How full each of the three bars is, 0 to 1. */
  fills: [number, number, number]
}

/** Where a page stands: its step, "2 / 4", and how full the three bars are. */
export function progressOf(id: OnboardingPageId): OnboardingProgress {
  const { step } = pageOf(id)
  const questions = ONBOARDING_PAGES.filter((page) => page.step === step && page.id !== "summary")
  const current = questions.findIndex((page) => page.id === id) + 1
  const position = current > 0 ? { current, total: questions.length } : null

  const fills = [0, 0, 0] as [number, number, number]
  for (let bar = 1; bar <= 3; bar++) {
    if (bar < step) fills[bar - 1] = 1
    else if (bar === step) fills[bar - 1] = position ? position.current / position.total : 1
  }
  return { step, position, fills }
}
