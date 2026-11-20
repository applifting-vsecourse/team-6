import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { KvintetDescription } from "@/features/kvintet/components/KvintetDescription"

// jsdom does no layout, so the test decides whether the clamped text overflows.
const stubOverflow = (isOverflowing: boolean) => {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(60)
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(isOverflowing ? 120 : 60)
}

afterEach(() => vi.restoreAllMocks())

describe("KvintetDescription", () => {
  it("shows a short description whole, without a toggle", () => {
    stubOverflow(false)
    render(<KvintetDescription text="Short and sweet." />)

    expect(screen.getByText("Short and sweet.")).toHaveClass("line-clamp-3")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("clamps a long description and lets the reader expand and collapse it", async () => {
    stubOverflow(true)
    const text = "A long description. ".repeat(14)
    render(<KvintetDescription text={text} />)
    const paragraph = screen.getByText(text.trim())

    const toggle = screen.getByRole("button", { name: "Show more" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(toggle).toHaveAttribute("aria-controls", paragraph.id)
    expect(paragraph).toHaveClass("line-clamp-3")

    await userEvent.click(toggle)
    expect(paragraph).not.toHaveClass("line-clamp-3")
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )

    await userEvent.click(screen.getByRole("button", { name: "Show less" }))
    expect(paragraph).toHaveClass("line-clamp-3")
  })
})
