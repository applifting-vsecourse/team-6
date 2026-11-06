import { z } from "zod"

// The step lives in the URL so the app header can show it and a reload keeps it.
// Anything that is not 1-3 (or missing) starts at the first step.
export const onboardingSearchSchema = z.object({
  step: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(1)
    .catch(1),
})
