import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { OnboardingCard } from "./OnboardingCard"

describe("OnboardingCard", () => {
  it("shows the title, hint and answer", () => {
    render(
      <OnboardingCard
        title="Question"
        hint="Hint"
      >
        <p>Answer</p>
      </OnboardingCard>,
    )

    expect(screen.getByRole("heading", { name: "Question" })).toBeInTheDocument()
    expect(screen.getByText("Hint")).toBeInTheDocument()
    expect(screen.getByText("Answer")).toBeInTheDocument()
  })

  it("turns the border red when the answer is missing", () => {
    const { container, rerender } = render(<OnboardingCard title="Question" />)
    expect(container.firstElementChild).toHaveClass("border-border")

    rerender(
      <OnboardingCard
        title="Question"
        isInvalid
      />,
    )
    expect(container.firstElementChild).toHaveClass("border-destructive")
  })
})
