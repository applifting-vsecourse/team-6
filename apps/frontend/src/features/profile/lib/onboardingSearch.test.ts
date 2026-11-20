import { describe, expect, it } from "vitest"

import { ONBOARDING_PAGE_IDS } from "./onboardingPages"
import { onboardingSearchSchema } from "./onboardingSearch"

const pageOf = (search: unknown) => onboardingSearchSchema.parse(search).page

describe("onboardingSearchSchema", () => {
  it.each(ONBOARDING_PAGE_IDS)("keeps the page %s", (page) => {
    expect(pageOf({ page })).toBe(page)
  })

  it("starts at the first page when the page is missing", () => {
    expect(pageOf({})).toBe("role")
  })

  it.each(["", "step2", "ROLE", 1, null, true, [], {}])(
    "falls back to the first page for %j",
    (page) => {
      expect(pageOf({ page })).toBe("role")
    },
  )

  it("ignores unrelated search params, the old `step` included", () => {
    expect(pageOf({ page: "days", step: 2, from: "/overview" })).toBe("days")
    expect(pageOf({ step: 2 })).toBe("role")
  })
})
