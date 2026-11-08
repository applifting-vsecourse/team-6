import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HowItWorksPage } from "@/features/legal/components/HowItWorksPage"

describe("HowItWorksPage", () => {
  it("explains the four steps under one title", () => {
    render(<HowItWorksPage />)

    expect(screen.getByRole("heading", { level: 1, name: "How Kvintet works" })).toBeInTheDocument()
    const steps = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(steps).toHaveLength(4)
    expect(steps[0]).toHaveTextContent("Create your profile")
    expect(steps[3]).toHaveTextContent("Meeting up")
  })

  it("numbers the steps", () => {
    render(<HowItWorksPage />)

    const steps = within(screen.getByRole("list")).getAllByRole("listitem")
    steps.forEach((step, i) => {
      expect(step).toHaveTextContent(String(i + 1))
      expect(step.querySelector("svg, img")).toBeNull()
    })
  })
})
