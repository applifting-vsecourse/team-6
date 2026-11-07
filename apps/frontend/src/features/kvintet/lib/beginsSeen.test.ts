import { afterEach, describe, expect, it, vi } from "vitest"

import { hasSeenBegins, markBeginsSeen } from "./beginsSeen"

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("beginsSeen", () => {
  it("is unseen until marked, and per kvintet", () => {
    expect(hasSeenBegins("k1")).toBe(false)

    markBeginsSeen("k1")

    expect(hasSeenBegins("k1")).toBe(true)
    expect(hasSeenBegins("k2")).toBe(false)
  })

  it("counts as seen and does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(hasSeenBegins("k1")).toBe(true)
    expect(() => markBeginsSeen("k1")).not.toThrow()
  })
})
