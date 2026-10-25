import { act, renderHook } from "@testing-library/react"

import { setTheme, useTheme } from "./theme"

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.classList.remove("dark")
  document.head.querySelector('meta[name="theme-color"]')?.remove()
})

describe("theme", () => {
  it("reads the <html> class set before first paint", () => {
    document.documentElement.classList.add("dark")
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe("dark")
  })

  it("switches the class, remembers the choice and re-renders subscribers", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe("light")

    act(() => result.current.setTheme("dark"))

    expect(result.current.theme).toBe("dark")
    expect(document.documentElement).toHaveClass("dark")
    expect(localStorage.getItem("theme")).toBe("dark")

    act(() => result.current.setTheme("light"))

    expect(document.documentElement).not.toHaveClass("dark")
    expect(localStorage.getItem("theme")).toBe("light")
  })

  it("still applies the theme when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(() => setTheme("dark")).not.toThrow()
    expect(document.documentElement).toHaveClass("dark")
  })

  it("tints the browser chrome with the theme's background", () => {
    const meta = document.createElement("meta")
    meta.name = "theme-color"
    meta.content = "#fbf8f2"
    document.head.append(meta)

    setTheme("dark")
    expect(meta.content).toBe("#141f36")

    setTheme("light")
    expect(meta.content).toBe("#fbf8f2")
  })
})
