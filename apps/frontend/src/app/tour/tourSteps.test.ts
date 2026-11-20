import { resolveTourStep } from "./tourSteps"

const base = {
  pathname: "/overview",
  isOnboarded: true,
  isAtHeader: false,
  isReplay: false,
}

describe("resolveTourStep", () => {
  it("leaves onboarding to its own cards", () => {
    expect(resolveTourStep({ ...base, pathname: "/onboarding", isOnboarded: false })).toBeNull()
    expect(resolveTourStep({ ...base, pathname: "/onboarding" })).toBeNull()
  })

  it("explains Home and the feed once onboarding is done", () => {
    expect(resolveTourStep(base)).toBe("overview")
    expect(resolveTourStep({ ...base, pathname: "/kvintet/feed" })).toBe("feed")
  })

  it("stays out of the way before onboarding is done and on other pages", () => {
    expect(resolveTourStep({ ...base, isOnboarded: false })).toBeNull()
    expect(resolveTourStep({ ...base, pathname: "/profile" })).toBeNull()
  })

  it("flies home to the header at the end, wherever the person is", () => {
    expect(resolveTourStep({ ...base, pathname: "/kvintet/feed", isAtHeader: true })).toBe("header")
  })

  it("starts a replay from Home even for a person with no finished onboarding", () => {
    expect(resolveTourStep({ ...base, isOnboarded: false, isReplay: true })).toBe("overview")
  })
})
