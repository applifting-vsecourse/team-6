import type { ParsedLocation } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { decodeRedirectUri, encodeRedirectUri, postSignInPath } from "./redirect"

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
