import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { OnboardingGuideBar } from "./OnboardingGuideBar"

describe("OnboardingGuideBar", () => {
  it("shows the tip, and Next only when the card can be left", async () => {
    const onNext = vi.fn()
    const { rerender } = render(<OnboardingGuideBar text="Pick your role" />)
    expect(screen.getByRole("status")).toHaveTextContent("Pick your role")
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()

    rerender(
      <OnboardingGuideBar
        text="Pick your role"
        onNext={onNext}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(onNext).toHaveBeenCalledOnce()
  })

  it("closes to just the mascot, and a tap on it brings the tip back", async () => {
    render(<OnboardingGuideBar text="Pick your role" />)
    // While the tip is open the mascot is not a control.
    expect(screen.getByRole("button", { name: "Show the tip" })).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Show the tip" }))
    expect(screen.getByRole("status")).toHaveTextContent("Pick your role")
  })

  it("opens again by itself for the next tip", async () => {
    const { rerender } = render(<OnboardingGuideBar text="Pick your role" />)
    await userEvent.click(screen.getByRole("button", { name: "Close" }))

    rerender(<OnboardingGuideBar text="Pick your days" />)

    expect(screen.getByRole("status")).toHaveTextContent("Pick your days")
  })

  it("never submits the form it sits in", () => {
    render(
      <OnboardingGuideBar
        text="Pick your role"
        onNext={vi.fn()}
      />,
    )

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("type", "button")
    }
  })
})
