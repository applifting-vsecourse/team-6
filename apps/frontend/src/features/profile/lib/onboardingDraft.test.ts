import { describe, expect, it } from "vitest"

import type { ProfileResponse } from "@/features/profile/api/profileApi"

import {
  DEFAULT_RADIUS_KM,
  draftFromProfile,
  hasProblem,
  NOTE_MAX_LENGTH,
  payloadFor,
  type OnboardingDraft,
} from "./onboardingDraft"
import { ONBOARDING_PAGES, type OnboardingPageId } from "./onboardingPages"

const empty = draftFromProfile(null)
const withDraft = (patch: Partial<OnboardingDraft>): OnboardingDraft => ({ ...empty, ...patch })

describe("draftFromProfile", () => {
  it("is empty for someone with no profile yet, with the default radius", () => {
    expect(empty).toMatchObject({
      roles: [],
      weekdays: false,
      latitude: null,
      radiusKm: DEFAULT_RADIUS_KM,
      meetingFrequency: undefined,
      note: "",
    })
  })

  it("carries every saved answer, so a reload or an edit keeps them", () => {
    const profile = {
      roles: ["copywriter"],
      teaches: [{ id: "1", slug: "excel" }],
      learns: [{ id: "2", slug: "python" }],
      interests: [{ id: "3", slug: "hiking" }],
      weekdays: true,
      evenings: true,
      latitude: 50.1,
      longitude: 14.4,
      radiusKm: 100,
      expectations: ["learn_new"],
      meetingFrequency: "WEEKLY",
      note: "hi",
    } as ProfileResponse

    expect(draftFromProfile(profile)).toMatchObject({
      roles: ["copywriter"],
      teachTagIds: ["1"],
      learnTagIds: ["2"],
      interestTagIds: ["3"],
      weekdays: true,
      weekends: false,
      evenings: true,
      latitude: 50.1,
      radiusKm: 100,
      meetingFrequency: "WEEKLY",
      note: "hi",
    })
  })

  it("falls back to the old single position as a role", () => {
    expect(
      draftFromProfile({ roles: [], position: "teacher" } as unknown as ProfileResponse).roles,
    ).toEqual(["teacher"])
  })
})

describe("hasProblem", () => {
  const cases: [OnboardingPageId, Partial<OnboardingDraft>, Partial<OnboardingDraft>][] = [
    ["role", {}, { roles: ["copywriter"] }],
    ["days", {}, { weekends: true }],
    ["time", {}, { afternoons: true }],
    ["place", {}, { latitude: 50, longitude: 14 }],
    ["frequency", {}, { meetingFrequency: "MONTHLY" }],
  ]

  it.each(cases)("%s needs an answer", (page, missing, answered) => {
    expect(hasProblem(page, withDraft(missing))).toBe(true)
    expect(hasProblem(page, withDraft(answered))).toBe(false)
  })

  it("never blocks the optional pages and the summary", () => {
    for (const page of ["teach", "learn", "interests", "summary", "expectations"] as const) {
      expect(hasProblem(page, empty)).toBe(false)
    }
  })

  it("holds a note to its length", () => {
    expect(hasProblem("note", withDraft({ note: "x".repeat(NOTE_MAX_LENGTH) }))).toBe(false)
    expect(hasProblem("note", withDraft({ note: "x".repeat(NOTE_MAX_LENGTH + 1) }))).toBe(true)
  })

  it("agrees with the pages model on which pages are required", () => {
    const blocking = ONBOARDING_PAGES.filter((page) => hasProblem(page.id, empty)).map(
      (page) => page.id,
    )

    expect(blocking).toEqual(ONBOARDING_PAGES.filter((page) => page.isRequired).map((p) => p.id))
  })
})

describe("payloadFor", () => {
  it("saves only the answers of the page", () => {
    expect(payloadFor("teach", withDraft({ teachTagIds: ["1"], learnTagIds: ["2"] }))).toEqual({
      teachTagIds: ["1"],
    })
    expect(payloadFor("time", withDraft({ mornings: true, weekdays: true }))).toEqual({
      mornings: true,
      afternoons: false,
      evenings: false,
    })
  })

  it("sends the role as the first position too", () => {
    expect(payloadFor("role", withDraft({ roles: ["copywriter", "teacher"] }))).toEqual({
      roles: ["copywriter", "teacher"],
      position: "copywriter",
    })
  })

  it("clears the legacy city when the place is saved", () => {
    expect(payloadFor("place", withDraft({ latitude: 50, longitude: 14, radiusKm: 10 }))).toEqual({
      latitude: 50,
      longitude: 14,
      radiusKm: 10,
      cityId: null,
    })
  })

  it("saves nothing from the summary", () => {
    expect(payloadFor("summary", empty)).toBeNull()
  })

  it("completes the onboarding on the last page only, with the note trimmed", () => {
    expect(payloadFor("note", withDraft({ note: "  hello  " }))).toEqual({
      note: "hello",
      completeOnboarding: true,
    })
    for (const page of ONBOARDING_PAGES.filter((p) => p.id !== "note")) {
      expect(payloadFor(page.id, empty)?.completeOnboarding).toBeUndefined()
    }
  })
})
