import type {
  MeetingFrequency,
  ProfileResponse,
  SaveProfileInput,
} from "@/features/profile/api/profileApi"
import type { OnboardingPageId } from "@/features/profile/lib/onboardingPages"

export const NOTE_MAX_LENGTH = 300
export const DEFAULT_RADIUS_KM = 25

/** Everything the onboarding asks, as the person has answered it so far. */
export type OnboardingDraft = {
  roles: string[]
  teachTagIds: string[]
  learnTagIds: string[]
  interestTagIds: string[]
  weekdays: boolean
  weekends: boolean
  mornings: boolean
  afternoons: boolean
  evenings: boolean
  latitude: number | null
  longitude: number | null
  radiusKm: number
  expectations: string[]
  meetingFrequency?: MeetingFrequency
  note: string
}

/** The draft starts as the saved profile, so a reload, Back or an edit from the profile page keeps every answer. */
export function draftFromProfile(profile: ProfileResponse): OnboardingDraft {
  return {
    roles: profile?.roles?.length ? profile.roles : profile?.position ? [profile.position] : [],
    teachTagIds: profile?.teaches?.map((tag) => tag.id) ?? [],
    learnTagIds: profile?.learns?.map((tag) => tag.id) ?? [],
    interestTagIds: profile?.interests?.map((tag) => tag.id) ?? [],
    weekdays: profile?.weekdays ?? false,
    weekends: profile?.weekends ?? false,
    mornings: profile?.mornings ?? false,
    afternoons: profile?.afternoons ?? false,
    evenings: profile?.evenings ?? false,
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    radiusKm: profile?.radiusKm && profile.radiusKm > 0 ? profile.radiusKm : DEFAULT_RADIUS_KM,
    expectations: profile?.expectations ?? [],
    meetingFrequency: profile?.meetingFrequency ?? undefined,
    note: profile?.note ?? "",
  }
}

/** The page's answer is missing (or, for the note, too long): the page shows its error and does not go on. */
export function hasProblem(page: OnboardingPageId, draft: OnboardingDraft): boolean {
  switch (page) {
    case "role":
      return draft.roles.length === 0
    case "days":
      return !draft.weekdays && !draft.weekends
    case "time":
      return !draft.mornings && !draft.afternoons && !draft.evenings
    case "place":
      return draft.latitude === null || draft.longitude === null
    case "frequency":
      return draft.meetingFrequency === undefined
    case "note":
      return draft.note.length > NOTE_MAX_LENGTH
    default:
      return false
  }
}

/**
 * What to save when the person leaves a page: only that page's answers (the backend takes a
 * partial profile). The last page also completes the onboarding. The summary asks nothing.
 */
export function payloadFor(
  page: OnboardingPageId,
  draft: OnboardingDraft,
): SaveProfileInput | null {
  switch (page) {
    case "role":
      return { roles: draft.roles, position: draft.roles[0] }
    case "teach":
      return { teachTagIds: draft.teachTagIds }
    case "learn":
      return { learnTagIds: draft.learnTagIds }
    case "interests":
      return { interestTagIds: draft.interestTagIds }
    case "summary":
      return null
    case "days":
      return { weekdays: draft.weekdays, weekends: draft.weekends }
    case "time":
      return { mornings: draft.mornings, afternoons: draft.afternoons, evenings: draft.evenings }
    case "place":
      return {
        latitude: draft.latitude,
        longitude: draft.longitude,
        radiusKm: draft.radiusKm,
        // The map is the only source of the place; this clears a legacy city.
        cityId: null,
      }
    case "expectations":
      return { expectations: draft.expectations }
    case "frequency":
      return { meetingFrequency: draft.meetingFrequency }
    // The last page: with it the onboarding is complete.
    case "note":
      return { note: draft.note.trim(), completeOnboarding: true }
  }
}
