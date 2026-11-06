import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KvintetSeats, type SeatMember } from "@/components/KvintetSeats"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const people = (n: number): SeatMember[] =>
  Array.from({ length: n }, (_, i) => ({ seed: `person-${i}` }))

const count = (container: HTMLElement, kind: "member" | "free") =>
  container.querySelectorAll(`[data-seat="${kind}"]`).length

describe("KvintetSeats", () => {
  it("fills a partial group up to five seats with free seats", () => {
    const { container } = render(<KvintetSeats members={people(3)} />)

    expect(count(container, "member")).toBe(3)
    expect(count(container, "free")).toBe(2)
  })

  it("shows an empty group as five free seats", () => {
    const { container } = render(<KvintetSeats members={[]} />)

    expect(count(container, "member")).toBe(0)
    expect(count(container, "free")).toBe(5)
  })

  it("has no free seat in a full group and ignores a sixth person", () => {
    const { container } = render(<KvintetSeats members={people(6)} />)

    expect(count(container, "member")).toBe(5)
    expect(count(container, "free")).toBe(0)
  })

  it("is labelled only when asked", () => {
    const { container, rerender } = render(<KvintetSeats members={people(5)} />)
    expect(container.querySelector("[role=img]")).toBeNull()

    rerender(
      <KvintetSeats
        members={people(5)}
        label="A kvintet of five"
      />,
    )
    expect(container.querySelector("[role=img]")).toHaveAttribute("aria-label", "A kvintet of five")
  })

  it("draws an anonymous member grey and a normal one in colour", () => {
    const grey = render(<KvintetSeats members={[{ seed: "seat-1", anonymous: true }]} />)
    const colour = render(<KvintetSeats members={[{ seed: "seat-1" }]} />)

    expect(grey.container.innerHTML).toMatch(/ced4de/i)
    expect(colour.container.innerHTML).not.toMatch(/ced4de/i)
  })
})
