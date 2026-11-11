import { useEffect } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"

import { OnboardingTitle } from "./OnboardingTitle"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

function TourOn() {
  const setTourActive = useMascotContext()?.setTourActive
  useEffect(() => setTourActive?.(true), [setTourActive])
  return null
}

describe("OnboardingTitle", () => {
  it("shows the title and description", () => {
    render(
      <OnboardingTitle
        title="Tell us about you"
        description="Others see your role."
      />,
    )

    expect(screen.getByRole("heading", { name: "Tell us about you" })).toBeInTheDocument()
    expect(screen.getByText("Others see your role.")).toBeInTheDocument()
  })

  it("draws the person's own blobatar only when it has a seed", () => {
    const { container, rerender } = render(
      <OnboardingTitle
        title="Title"
        description="Text"
      />,
    )
    expect(container.querySelector("svg")).toBeNull()
    // No avatar: no grid and no pinned column, so title and description start at the same edge.
    expect(screen.getByRole("heading").className).not.toContain("col-start-2")
    expect(container.firstElementChild?.className).not.toContain("grid")

    rerender(
      <OnboardingTitle
        title="Title"
        description="Text"
        avatarSeed="jana"
      />,
    )
    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("hands the avatar to the mascot while the tour runs", () => {
    const { container } = render(
      <MascotProvider>
        <TourOn />
        <OnboardingTitle
          title="Title"
          description="Text"
          avatarSeed="jana"
        />
      </MascotProvider>,
    )

    expect(container.querySelector("svg")).toBeNull()
  })

  it("keeps the avatar where it was when there is no tour, as on a repeat of onboarding", () => {
    const { container } = render(
      <MascotProvider>
        <OnboardingTitle
          title="Title"
          description="Text"
          avatarSeed="jana"
        />
      </MascotProvider>,
    )

    expect(container.querySelector("svg")).not.toBeNull()
  })
})
