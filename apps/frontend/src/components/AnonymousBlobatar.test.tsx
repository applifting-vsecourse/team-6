import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AnonymousBlobatar, Face, FreeSeat } from "@/components/AnonymousBlobatar"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const GREY = /ced4de/i

const html = (ui: React.ReactElement) => render(ui).container.innerHTML

describe("AnonymousBlobatar", () => {
  it("is grey, while a normal face is not", () => {
    expect(html(<AnonymousBlobatar seed="seat-1" />)).toMatch(GREY)
    expect(html(<Face seed="seat-1" />)).not.toMatch(GREY)
  })

  it("keeps the same face for the same seat", () => {
    expect(html(<AnonymousBlobatar seed="seat-1" />)).toBe(
      html(<AnonymousBlobatar seed="seat-1" />),
    )
    expect(html(<AnonymousBlobatar seed="seat-1" />)).not.toBe(
      html(<AnonymousBlobatar seed="seat-2" />),
    )
  })
})

describe("FreeSeat", () => {
  it("is a decorative dashed circle", () => {
    const { container } = render(<FreeSeat />)

    expect(container.firstElementChild).toHaveClass("border-dashed", "rounded-full")
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true")
  })
})

describe("Face motion modes", () => {
  // A static blobatar is one <img>; an animated one is inline SVG.
  const animated = (container: HTMLElement) => container.querySelector("svg")

  it("is static by default and animates continuously with `always`", () => {
    expect(animated(render(<Face seed="a" />).container)).toBeNull()
    expect(
      animated(
        render(
          <Face
            seed="a"
            motion="always"
          />,
        ).container,
      ),
    ).not.toBeNull()
  })

  it("`hover` is static until a mouse is over it, then animated, then static again", () => {
    const { container } = render(
      <Face
        seed="a"
        motion="hover"
      />,
    )
    const wrapper = container.firstElementChild as HTMLElement

    expect(animated(container)).toBeNull()
    fireEvent.pointerEnter(wrapper, { pointerType: "mouse" })
    expect(animated(container)).not.toBeNull()
    fireEvent.pointerLeave(wrapper)
    expect(animated(container)).toBeNull()
  })

  it("`hover` ignores touch", () => {
    const { container } = render(
      <Face
        seed="a"
        motion="hover"
      />,
    )

    fireEvent.pointerEnter(container.firstElementChild as HTMLElement, { pointerType: "touch" })

    expect(animated(container)).toBeNull()
  })
})
