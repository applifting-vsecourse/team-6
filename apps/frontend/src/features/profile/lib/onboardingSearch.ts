import { z } from "zod"

import { FIRST_ONBOARDING_PAGE, ONBOARDING_PAGE_IDS } from "@/features/profile/lib/onboardingPages"

// The page lives in the URL so Back and a reload keep it, and the header can show its step.
// Anything that is not a page (or missing) starts at the first one.
export const onboardingSearchSchema = z.object({
  page: z.enum(ONBOARDING_PAGE_IDS).default(FIRST_ONBOARDING_PAGE).catch(FIRST_ONBOARDING_PAGE),
})
