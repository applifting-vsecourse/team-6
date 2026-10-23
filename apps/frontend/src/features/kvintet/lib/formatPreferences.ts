import type { TFunction } from "i18next"

import type { CommonPreferences } from "@/features/kvintet/api/kvintetApi"

export function formatCommonPreferences(
  preferences: CommonPreferences | null | undefined,
  t: TFunction,
): string | null {
  if (!preferences) return null

  const parts: string[] = []

  if (preferences.city) {
    parts.push(preferences.city.toUpperCase())
  }

  if (preferences.mornings) {
    parts.push(String(t("kvintet.preferences.mornings")).toUpperCase())
  }
  if (preferences.afternoons) {
    parts.push(String(t("kvintet.preferences.afternoons")).toUpperCase())
  }
  if (preferences.evenings) {
    parts.push(String(t("kvintet.preferences.evenings")).toUpperCase())
  }

  if (preferences.weekdays) {
    parts.push(String(t("kvintet.preferences.weekdays")).toUpperCase())
  }
  if (preferences.weekends) {
    parts.push(String(t("kvintet.preferences.weekends")).toUpperCase())
  }

  if (preferences.meetingFrequency) {
    parts.push(String(t(`meetingFrequency.${preferences.meetingFrequency}`)).toUpperCase())
  }

  return parts.length > 0 ? parts.join(" · ") : null
}
