import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useVisualViewportVars } from "./useVisualViewportVars"

const root = document.documentElement.style

const stubViewport = (height: number, scale = 1) => {
  const viewport = Object.assign(new EventTarget(), { height, offsetTop: 0, scale })
  vi.stubGlobal("visualViewport", viewport)
  vi.stubGlobal("innerHeight", 800)
  return viewport
}

describe("useVisualViewportVars", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("publishes the visible height and keyboard inset, and cleans up", () => {
    const viewport = stubViewport(800)

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

  it("keeps the variables until the last of several dialogs unmounts", () => {
    stubViewport(500)

    const first = renderHook(() => useVisualViewportVars())
    const second = renderHook(() => useVisualViewportVars())
    first.unmount()
    expect(root.getPropertyValue("--vv-height")).toBe("500px")

    second.unmount()
    expect(root.getPropertyValue("--vv-height")).toBe("")
  })

  it("does not mistake pinch-zoom for a keyboard", () => {
    stubViewport(400, 2)

    const { unmount } = renderHook(() => useVisualViewportVars())
    expect(root.getPropertyValue("--keyboard-inset")).toBe("0px")
    expect(root.getPropertyValue("--vv-height")).toBe("800px")
    unmount()
  })

  it("does nothing without visualViewport", () => {
    vi.stubGlobal("visualViewport", undefined)
    expect(() => renderHook(() => useVisualViewportVars())).not.toThrow()
  })
})
