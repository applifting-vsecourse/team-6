import { act, render } from "@testing-library/react"

import { setTheme } from "@/lib/theme"

import { ThemedImage } from "./ThemedImage"

afterEach(() => {
  setTheme("light")
  localStorage.clear()
})

describe("ThemedImage", () => {
  it("shows the file for the current theme and swaps it when the theme changes", () => {
    const { container } = render(
      <ThemedImage
        light="/light.svg"
        dark="/dark.svg"
        className="size-8"
      />,
    )
    const img = container.querySelector("img")!

    expect(img).toHaveAttribute("src", "/light.svg")
    expect(img).toHaveAttribute("alt", "")
    expect(img).toHaveClass("size-8")

    act(() => setTheme("dark"))

    expect(img).toHaveAttribute("src", "/dark.svg")
  })
})
