import { describe, expect, it } from "vitest"

import {
  nextPage,
  ONBOARDING_PAGES,
  pageOf,
  previousPage,
  progressOf,
  type OnboardingPageId,
} from "./onboardingPages"

describe("onboarding pages", () => {
  it("are the eleven of the design, in order", () => {
    expect(ONBOARDING_PAGES.map((page) => page.id)).toEqual([
      "role",
      "teach",
      "learn",
      "interests",
      "summary",
      "days",
      "time",
      "place",
      "expectations",
      "frequency",
      "note",
    ])
  })

  it("walk forward and back, and end at both sides", () => {
    expect(nextPage("role")).toBe("teach")
    expect(nextPage("interests")).toBe("summary")
    expect(nextPage("summary")).toBe("days")
    expect(nextPage("note")).toBeUndefined()
    expect(previousPage("days")).toBe("summary")
    expect(previousPage("role")).toBeUndefined()
  })

  it("ask for the role, days, time, place and frequency, and nothing else", () => {
    const required = ONBOARDING_PAGES.filter((page) => page.isRequired).map((page) => page.id)

    expect(required).toEqual(["role", "days", "time", "place", "frequency"])
  })
})

describe("progressOf", () => {
  const at = (id: OnboardingPageId) => progressOf(id)

  it("counts the questions of a step, as the design does", () => {
    expect(at("role").position).toEqual({ current: 1, total: 4 })
    expect(at("interests").position).toEqual({ current: 4, total: 4 })
    expect(at("days").position).toEqual({ current: 1, total: 3 })
    expect(at("frequency").position).toEqual({ current: 2, total: 3 })
  })

  it("fills the bar of the step by the question, and earlier bars in full", () => {
    expect(at("role").fills).toEqual([0.25, 0, 0])
    expect(at("time").fills).toEqual([1, 2 / 3, 0])
    expect(at("frequency").fills).toEqual([1, 1, 2 / 3])
    expect(at("note").fills).toEqual([1, 1, 1])
  })

  it("is full, with no count, on the summary", () => {
    expect(at("summary").position).toBeNull()
    expect(at("summary").fills).toEqual([1, 0, 0])
  })

  it("knows the step of every page", () => {
    expect(pageOf("summary").step).toBe(1)
    expect(pageOf("place").step).toBe(2)
    expect(pageOf("note").step).toBe(3)
  })
})
