import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CoreIdeaAnimation } from "@/components/CoreIdeaAnimation/CoreIdeaAnimation"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

// jsdom has no matchMedia; each test says which queries match.
function stubMedia(matching: string[]) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: matching.some((m) => query.includes(m)),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  )
}

const stage = (container: HTMLElement) => container.querySelector<HTMLElement>(".ci-stage")!

describe("CoreIdeaAnimation", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("describes the story to a screen reader and hides the scenes", () => {
    stubMedia([])
    render(<CoreIdeaAnimation />)

    expect(screen.getByRole("img", { name: /Five people fill the seats/ })).toBeInTheDocument()
  })

  it("draws the phone stage with the ring and four step tabs under it", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)

    expect(container.firstElementChild).toHaveClass("ci-m")
    expect(container.querySelector(".ci-ring")).not.toBeNull()
    expect(screen.getAllByRole("tab")).toHaveLength(4)
    expect(container.querySelector(".ci-cursor")).toBeNull()
  })

  it("draws the desktop stage as the card with a pointer, and the same tabs", () => {
    stubMedia(["min-width"])
    const { container } = render(<CoreIdeaAnimation />)

    expect(container.firstElementChild).toHaveClass("ci-d")
    expect(container.querySelector(".ci-card")).not.toBeNull()
    expect(container.querySelector(".ci-cursor")).not.toBeNull()
    expect(container.querySelector(".ci-ring")).toBeNull()
    expect(screen.getAllByRole("tab")).toHaveLength(4)
  })

  it("jumps to a step when its tab is picked and plays on from there", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)
    const at = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

    at(1_000)
    expect(screen.getByRole("tab", { name: /01/ })).toHaveAttribute("aria-selected", "true")

    fireEvent.mouseDown(screen.getByRole("tab", { name: /03/ }), { button: 0 })
    at(100)
    expect(stage(container)).toHaveClass("ci-n2", "ci-tray-feed")
    expect(screen.getByRole("tab", { name: /03/ })).toHaveAttribute("aria-selected", "true")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(0)

    at(1_200) // the neighbours take their seats, as in the story
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(2)

    fireEvent.mouseDown(screen.getByRole("tab", { name: /04/ }), { button: 0 })
    at(100)
    expect(stage(container)).toHaveClass("ci-n3", "ci-landed")
    expect(container.querySelector(".ci-count")).toHaveTextContent("3 / 5")
  })

  it("lets reduced motion step through still scenes with the tabs", () => {
    stubMedia(["reduced-motion"])
    const { container } = render(<CoreIdeaAnimation />)

    fireEvent.mouseDown(screen.getByRole("tab", { name: /01/ }), { button: 0 })

    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(0)

    fireEvent.mouseDown(screen.getByRole("tab", { name: /04/ }), { button: 0 })

    expect(stage(container)).toHaveClass("ci-n3", "ci-solved")
  })

  it("holds the last scene for reduced motion, with all five seated", () => {
    stubMedia(["reduced-motion"])
    const { container } = render(<CoreIdeaAnimation />)

    act(() => void vi.advanceTimersByTime(60_000))

    expect(stage(container)).toHaveClass("ci-n3", "ci-solved", "ci-landed")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(5)
    expect(container.querySelector(".ci-count")).toHaveTextContent("5 / 5")
  })

  it("plays the story: alone, filling in, joining, then everyone solved", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)
    const at = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

    at(1_000)
    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely", "ci-think")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(0)

    at(4_000) // 5.0 s: filling in the onboarding
    expect(stage(container)).toHaveClass("ci-n1", "ci-onb")

    at(5_000) // 10.0 s: two seats taken
    expect(stage(container)).toHaveClass("ci-n2")
    expect(container.querySelector(".ci-count")).toHaveTextContent("2 / 5")

    at(1_200) // 11.2 s: joined, the solo blobatar sits on seat 0
    expect(stage(container)).toHaveClass("ci-landed", "ci-n3")
    expect(container.querySelector(".ci-s0")).toHaveClass("ci-on")
    expect(container.querySelector(".ci-count")).toHaveTextContent("3 / 5")

    at(2_200) // 13.4 s: the kvintet is complete, every seat shows what it teaches and wants
    expect(stage(container)).toHaveClass("ci-started", "ci-tagged")
    expect(stage(container)).not.toHaveClass("ci-solved")

    at(3_400) // 16.8 s: the wishes are filled from the others' tags
    expect(stage(container)).toHaveClass("ci-solved")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(5)
    expect(container.querySelector(".ci-count")).toHaveTextContent("5 / 5")
  })

  it("starts over after the ending", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)

    act(() => void vi.advanceTimersByTime(300 + 19_000 + 200))

    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(stage(container)).not.toHaveClass("ci-solved")
    expect(container.querySelector(".ci-count")).toHaveTextContent("0 / 5")
  })

  it("times the desktop stage: the pointer joins 600 ms later and the loop is 600 ms longer", () => {
    stubMedia(["min-width"])
    const { container } = render(<CoreIdeaAnimation />)
    const at = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

    at(9_900) // the pointer sets off at 10.06 s
    expect(stage(container)).not.toHaveClass("ci-cursor-go")

    at(300) // 10.2 s: on its way to Join, nobody has joined yet
    expect(stage(container)).toHaveClass("ci-cursor-go")
    expect(stage(container)).not.toHaveClass("ci-cursor-done", "ci-landed")

    at(1_500) // 11.7 s: it clicked, the solo blobatar landed and the pointer is gone
    expect(stage(container)).toHaveClass("ci-cursor-done", "ci-landed")

    // The phone loop restarts at 19.36 s; the desktop one is still on its ending, fading out.
    at(7_700) // 19.4 s
    expect(stage(container)).toHaveClass("ci-solved", "ci-fade")

    at(700) // 20.1 s: restarted
    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(stage(container)).not.toHaveClass("ci-solved")
  })
})
