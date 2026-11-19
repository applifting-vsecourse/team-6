import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { OnboardingProgress } from "./OnboardingProgress"

const widths = () =>
  [...screen.getByRole("progressbar").children].map(
    (bar) => (bar.firstElementChild as HTMLElement).style.width,
  )

describe("OnboardingProgress", () => {
  it("names the step and counts its questions", () => {
    render(<OnboardingProgress page="time" />)

    expect(screen.getByText("When and where")).toBeInTheDocument()
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
  })

  it("draws one bar per step, earlier ones full and the current one filling per question", () => {
    render(<OnboardingProgress page="role" />)
    expect(widths()).toEqual(["25%", "0%", "0%"])
  })

  it("fills the earlier bars in full", () => {
    render(<OnboardingProgress page="frequency" />)
    expect(widths().map((width) => Math.round(parseFloat(width)))).toEqual([100, 100, 67])
  })

  it("is full, with a tick instead of a count, on the summary", () => {
    render(<OnboardingProgress page="summary" />)

    expect(screen.getByText("✓")).toHaveClass("text-ok")
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
    expect(widths()).toEqual(["100%", "0%", "0%"])
  })

  it("tells a screen reader how far along the person is", () => {
    render(<OnboardingProgress page="note" />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })
})
