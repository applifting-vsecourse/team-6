import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HowItWorksPage } from "./HowItWorksPage"

describe("HowItWorksPage", () => {
  it("renders heading and key principles", () => {
    render(<HowItWorksPage />)

    expect(screen.getByRole("heading", { name: /How Kvintet works/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Key principles/i })).toBeInTheDocument()
    expect(screen.getByText(/Tell us about yourself/i)).toBeInTheDocument()
    expect(screen.getByText(/Pick a proposal/i)).toBeInTheDocument()
    expect(screen.getByText(/Form your kvintet/i)).toBeInTheDocument()
  })
})
