import type { ParsedLocation } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { decodeRedirectUri, encodeRedirectUri } from "./redirect"

describe("redirect uri", () => {
  it("round-trips a location with a query string", () => {
    const location = { href: "/overview?tab=a&b=c" } as ParsedLocation

    expect(decodeRedirectUri(encodeRedirectUri(location))).toBe("/overview?tab=a&b=c")
  })

  it("falls back to home on malformed input", () => {
    expect(decodeRedirectUri("%E0%A4%A")).toBe("/")
  })
})
