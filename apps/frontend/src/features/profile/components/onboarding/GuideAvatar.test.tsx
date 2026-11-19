import { useEffect } from "react"
import { render, screen } from "@testing-library/react"
import { happy } from "blobatar/expression"
import { describe, expect, it, vi } from "vitest"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"

import { GuideAvatar } from "./GuideAvatar"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

function TourOn() {
  const setTourActive = useMascotContext()?.setTourActive
  useEffect(() => setTourActive?.(true), [setTourActive])
  return null
}

function Stage() {
  const stage = useMascotContext()?.stage
  return (
    <p data-testid="stage">
      {stage
        ? `${stage.anchorId}|${stage.seed}|${stage.expression ? "happy" : "neutral"}|${stage.shakeKey}`
        : "none"}
    </p>
  )
}

describe("GuideAvatar", () => {
  it("draws the person's avatar itself when no tour runs (a repeat of onboarding)", () => {
    const { container } = render(
      <MascotProvider>
        <GuideAvatar seed="jana" />
        <Stage />
      </MascotProvider>,
    )

    expect(container.querySelector("svg")).not.toBeNull()
    expect(screen.getByTestId("stage")).toHaveTextContent("none")
  })

  it("leaves the face to the mascot while the tour runs, and tells it who, how and when to shake", () => {
    const { container } = render(
      <MascotProvider>
        <TourOn />
        <GuideAvatar
          seed="jana"
          expression={happy}
          shakeKey={2}
        />
        <Stage />
      </MascotProvider>,
    )

    // The mascot overlay stands on this spot, so the page draws nothing there.
    expect(container.querySelector("svg")).toBeNull()
    expect(screen.getByTestId("stage")).toHaveTextContent("onboarding-avatar|jana|happy|2")
  })

  it("keeps the spot, 96px, even with nothing in it", () => {
    const { container } = render(<GuideAvatar />)

    expect(container.firstElementChild).toHaveClass("size-24")
    expect(container.querySelector("svg")).toBeNull()
  })

  it("works outside a provider", () => {
    const { container } = render(<GuideAvatar seed="jana" />)

    expect(container.querySelector("svg")).not.toBeNull()
  })
})
