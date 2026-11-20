import { render } from "@testing-library/react"
import { happy } from "blobatar/expression"
import type * as Motion from "motion/react"
import { describe, expect, it, vi } from "vitest"

import { MascotFace } from "./MascotFace"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("MascotFace", () => {
  it("draws the avatar of a seed", () => {
    const { container } = render(<MascotFace name="jana" />)

    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("holds a pose, which changes how the same seed is drawn", () => {
    const neutral = render(<MascotFace name="jana" />).container.innerHTML
    const smiling = render(
      <MascotFace
        name="jana"
        expression={happy}
      />,
    ).container.innerHTML

    expect(smiling).not.toBe(neutral)
  })

  describe("the shake", () => {
    const rig = vi.hoisted(() => ({
      animate: vi.fn(),
      isReduced: false,
      // Stable, like the real hook's: a new scope every render would shake on every render.
      scope: { current: null as HTMLElement | null },
    }))
    // `useAnimate` hands out a ref and an `animate`; here the animation is only noted.
    vi.mock("motion/react", async (importOriginal) => {
      const actual = await importOriginal<typeof Motion>()
      return {
        ...actual,
        useAnimate: () => [rig.scope, rig.animate],
        useReducedMotion: () => rig.isReduced,
      }
    })

    beforeEach(() => {
      rig.animate.mockClear()
      rig.isReduced = false
    })

    it("does not happen when the face first appears, even with a key", () => {
      render(
        <MascotFace
          name="jana"
          shakeKey={0}
        />,
      )

      expect(rig.animate).not.toHaveBeenCalled()
    })

    it("happens once each time the key changes, to one side and the other", () => {
      const { rerender } = render(
        <MascotFace
          name="jana"
          shakeKey={0}
        />,
      )

      rerender(
        <MascotFace
          name="jana"
          shakeKey={1}
        />,
      )
      expect(rig.animate).toHaveBeenCalledOnce()
      const target = rig.animate.mock.calls[0]?.[1] as { x: number[] }
      expect(target.x).toContain(-7)
      expect(target.x).toContain(7)

      rerender(
        <MascotFace
          name="jana"
          shakeKey={1}
        />,
      )
      expect(rig.animate).toHaveBeenCalledOnce()

      rerender(
        <MascotFace
          name="jana"
          shakeKey={2}
        />,
      )
      expect(rig.animate).toHaveBeenCalledTimes(2)
    })

    it("stays still for someone who asked for less motion", () => {
      rig.isReduced = true
      const { rerender } = render(
        <MascotFace
          name="jana"
          shakeKey={0}
        />,
      )

      rerender(
        <MascotFace
          name="jana"
          shakeKey={1}
        />,
      )

      expect(rig.animate).not.toHaveBeenCalled()
    })
  })
})
