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

  it("draws the phone stage with step captions and dots", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)

    expect(container.firstElementChild).toHaveClass("ci-m")
    expect(container.querySelectorAll(".ci-cap")).toHaveLength(6)
    expect(container.querySelectorAll(".ci-dots i")).toHaveLength(6)
    expect(container.querySelector(".ci-steps")).toBeNull()
    expect(container.querySelector(".ci-cursor")).toBeNull()
  })

  it("draws the desktop stage with the list of steps, the card and a pointer", () => {
    stubMedia(["min-width"])
    const { container } = render(<CoreIdeaAnimation />)

    expect(container.firstElementChild).toHaveClass("ci-d")
    expect(container.querySelectorAll(".ci-step")).toHaveLength(6)
    expect(container.querySelector(".ci-card")).not.toBeNull()
    expect(container.querySelector(".ci-cursor")).not.toBeNull()
    expect(container.querySelector(".ci-cap")).toBeNull()
  })

  it("holds the last meeting scene for reduced motion, with all five seated", () => {
    stubMedia(["reduced-motion"])
    const { container } = render(<CoreIdeaAnimation />)

    act(() => void vi.advanceTimersByTime(60_000))

    expect(stage(container)).toHaveClass("ci-n5", "ci-meet", "ci-landed")
    expect(container.querySelectorAll(".ci-seat.ci-on")).toHaveLength(5)
    expect(container.querySelector(".ci-count")).toHaveTextContent("5 / 5")
  })

  it("plays the story: alone, filling in, joining, then the logo", () => {
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

    at(12_000) // 23.5 s: the five seats melt into the logo
    expect(stage(container)).toHaveClass("ci-logo")
  })

  it("starts over after the logo", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)

    act(() => void vi.advanceTimersByTime(300 + 26_300 + 200))

    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(stage(container)).not.toHaveClass("ci-logo")
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

    // The phone loop restarts at 26.66 s; the desktop one is still on its logo.
    at(15_000)
    expect(stage(container)).toHaveClass("ci-logo", "ci-fade")

    at(700) // 27.4 s: restarted
    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(stage(container)).not.toHaveClass("ci-logo")
  })

  it("pauses on the button and plays again from the beginning", () => {
    stubMedia([])
    const { container } = render(<CoreIdeaAnimation />)

    act(() => void vi.advanceTimersByTime(5_000))
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }))

    act(() => void vi.advanceTimersByTime(60_000))
    expect(stage(container)).toHaveClass("ci-meet", "ci-landed")
    expect(container.querySelector(".ci-count")).toHaveTextContent("5 / 5")

    fireEvent.click(screen.getByRole("button", { name: "Play animation" }))
    act(() => void vi.advanceTimersByTime(200))
    expect(stage(container)).toHaveClass("ci-n0", "ci-lonely")
    expect(screen.getByRole("button", { name: "Pause animation" })).toBeInTheDocument()
  })

  it("offers no pause button when reduced motion already holds a still frame", () => {
    stubMedia(["reduced-motion"])
    render(<CoreIdeaAnimation />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
