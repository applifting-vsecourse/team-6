import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { StepBlobatar } from "@/components/StepBlobatar"
import { Blobatar } from "@/components/ui/blobatar"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

// A static blobatar is one <img>; an animated one is inline SVG.
const animated = (container: HTMLElement) => container.querySelector("svg")

describe("StepBlobatar", () => {
  it("is static until a mouse is over it, then looks around, then rests again", () => {
    const { container } = render(
      <StepBlobatar
        seed="jana"
        className="size-12"
      />,
    )
    const wrapper = container.firstElementChild as HTMLElement

    expect(animated(container)).toBeNull()
    fireEvent.pointerEnter(wrapper, { pointerType: "mouse" })
    expect(animated(container)).not.toBeNull()
    fireEvent.pointerLeave(wrapper)
    expect(animated(container)).toBeNull()
  })

  it("wears the happy pose, so it is not the plain face of the same seed", () => {
    const step = render(<StepBlobatar seed="jana" />).container.innerHTML
    const plain = render(<Blobatar name="jana" />).container.innerHTML

    expect(step).not.toBe(plain)
  })
})
