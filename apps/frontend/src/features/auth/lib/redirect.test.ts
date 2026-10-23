import type { ParsedLocation } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import {
  decodeRedirectUri,
  encodeRedirectUri,
  isOnboarded,
  postSignInLocation,
  postSignInPath,
} from "./redirect"

describe("isOnboarded", () => {
  it("treats undefined profile (fetch failed/omitted) as onboarded to avoid disrupting login flow", () => {
    expect(isOnboarded(undefined)).toBe(true)
    expect(isOnboarded()).toBe(true)
  })

  it("treats null profile (user has no profile record) as not onboarded", () => {
    expect(isOnboarded(null)).toBe(false)
  })

  it("treats profile without onboardingCompletedAt as not onboarded", () => {
    expect(isOnboarded({ onboardingCompletedAt: null })).toBe(false)
    expect(isOnboarded({ onboardingCompletedAt: undefined })).toBe(false)
  })

  it("treats profile with onboardingCompletedAt timestamp as onboarded", () => {
    expect(isOnboarded({ onboardingCompletedAt: "2026-10-21T10:00:00Z" })).toBe(true)
    expect(isOnboarded({ onboardingCompletedAt: new Date() })).toBe(true)
  })
})

describe("redirect uri", () => {
  it("round-trips a location with a query string", () => {
    const location = { href: "/overview?tab=a&b=c" } as ParsedLocation

    expect(decodeRedirectUri(encodeRedirectUri(location))).toBe("/overview?tab=a&b=c")
  })

  it("falls back to home on malformed input", () => {
    expect(decodeRedirectUri("%E0%A4%A")).toBe("/")
  })
})

const encoded = (path: string) => encodeURIComponent(path)

describe("postSignInPath", () => {
  it("goes to Overview by default", () => {
    expect(postSignInPath()).toBe("/overview")
  })

  it("returns to the page the user came from", () => {
    expect(postSignInPath(encoded("/profile?tab=2"))).toBe("/profile?tab=2")
  })

  it("sends users who have not finished onboarding to onboarding, even with a deep link", () => {
    expect(postSignInPath(encoded("/profile"), false)).toBe("/onboarding")
  })

  it("ignores redirect targets that leave the app", () => {
    expect(postSignInPath(encoded("https://evil.example"))).toBe("/overview")
    expect(postSignInPath(encoded("//evil.example"))).toBe("/overview")
    expect(postSignInPath(encoded("/\\evil.example"))).toBe("/overview")
    expect(postSignInPath(encoded("/\t/evil.example"))).toBe("/overview")
  })
})

describe("postSignInLocation", () => {
  it("splits a deep link with a query string and hash into router options", () => {
    expect(postSignInLocation(encoded("/profile?tab=2&x=y#bio"))).toEqual({
      to: "/profile",
      search: { tab: "2", x: "y" },
      hash: "bio",
    })
  })

  it("has an empty search and no hash for a plain path", () => {
    expect(postSignInLocation()).toEqual({ to: "/overview", search: {}, hash: undefined })
  })
})
