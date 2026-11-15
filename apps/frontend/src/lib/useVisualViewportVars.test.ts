import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useVisualViewportVars } from "./useVisualViewportVars"

const root = document.documentElement.style

describe("useVisualViewportVars", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("publishes the visible height and keyboard inset, and cleans up", () => {
    const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 })
    vi.stubGlobal("visualViewport", viewport)
    vi.stubGlobal("innerHeight", 800)

    const { unmount } = renderHook(() => useVisualViewportVars())
    expect(root.getPropertyValue("--keyboard-inset")).toBe("0px")

    viewport.height = 500
    viewport.dispatchEvent(new Event("resize"))
    expect(root.getPropertyValue("--vv-height")).toBe("500px")
    expect(root.getPropertyValue("--keyboard-inset")).toBe("300px")

    unmount()
    expect(root.getPropertyValue("--vv-height")).toBe("")
    expect(root.getPropertyValue("--keyboard-inset")).toBe("")
  })

  it("does nothing without visualViewport", () => {
    vi.stubGlobal("visualViewport", undefined)
    expect(() => renderHook(() => useVisualViewportVars())).not.toThrow()
  })
})
