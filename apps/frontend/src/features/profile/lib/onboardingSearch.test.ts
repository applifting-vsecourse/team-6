import { describe, expect, it } from "vitest"

import { onboardingSearchSchema } from "./onboardingSearch"

const stepOf = (search: unknown) => onboardingSearchSchema.parse(search).step

describe("onboardingSearchSchema", () => {
  it.each([1, 2, 3] as const)("keeps step %i", (step) => {
    expect(stepOf({ step })).toBe(step)
  })

  it("starts at the first step when the step is missing", () => {
    expect(stepOf({})).toBe(1)
  })

  it.each([0, 4, -1, 1.5, "abc", "2", null, true, [], {}])("falls back to 1 for %j", (step) => {
    expect(stepOf({ step })).toBe(1)
  })

  it("ignores unrelated search params", () => {
    expect(stepOf({ step: 2, from: "/overview" })).toBe(2)
  })
})
