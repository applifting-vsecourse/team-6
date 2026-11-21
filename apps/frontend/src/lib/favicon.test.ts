import { describe, expect, it } from "vitest"

import { faviconHref, faviconSvg } from "@/lib/favicon"

describe("faviconSvg", () => {
  it("draws the same avatar for the same seed and a different one for another", () => {
    expect(faviconSvg("jana")).toBe(faviconSvg("jana"))
    expect(faviconSvg("jana")).not.toBe(faviconSvg("petr"))
  })

  it("is one svg, cropped tight, with no outline", () => {
    const svg = faviconSvg("jana")
    expect(svg.match(/<svg/g)).toHaveLength(1)
    expect(svg).toContain('viewBox="6 6 88 88"')
    expect(svg).not.toContain("stroke")
  })
})

describe("faviconHref", () => {
  it("is a data URI that decodes back to the svg", () => {
    const href = faviconHref("jana")
    expect(href.startsWith("data:image/svg+xml,")).toBe(true)
    expect(decodeURIComponent(href.slice("data:image/svg+xml,".length))).toBe(faviconSvg("jana"))
  })
})
