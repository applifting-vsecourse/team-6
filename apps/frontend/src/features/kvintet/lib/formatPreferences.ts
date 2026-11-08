import type { TFunction } from "i18next"

import type { FeedKvintet } from "@/features/kvintet/api/kvintetFeedQueryOptions"

const AVAILABILITY = ["mornings", "afternoons", "evenings", "weekdays", "weekends"] as const

/** What every member has in common, e.g. "evenings · weekdays · every 14 days". Never a place. */
export function formatSharedPreferences(
  kvintet: Pick<FeedKvintet, "commonAvailability" | "meetingFrequency">,
  t: TFunction,
): string {
  return [
    ...AVAILABILITY.filter((key) => kvintet.commonAvailability[key]).map((key) =>
      String(t(`kvintet.preferences.${key}`)).toLowerCase(),
    ),
    kvintet.meetingFrequency ? String(t(`meetingFrequency.${kvintet.meetingFrequency}`)) : null,
  ]
    .filter(Boolean)
    .join(" · ")
}
