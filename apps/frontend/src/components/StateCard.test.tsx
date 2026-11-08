import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { StateAlert } from "@/components/StateAlert"
import { StateCard } from "@/components/StateCard"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("StateCard", () => {
  it("says what is missing and offers what to do", () => {
    render(
      <StateCard
        title="Nothing here yet"
        text="Be the first."
      >
        <button type="button">Start</button>
      </StateCard>,
    )

    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument()
    expect(screen.getByText("Be the first.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
  })

  it("keeps the grey faces out of the accessibility tree", () => {
    const { container } = render(
      <StateCard
        title="t"
        text="x"
      />,
    )

    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3)
  })
})

describe("StateAlert", () => {
  it("is an alert with the retry action", () => {
    render(
      <StateAlert
        seed="seat-5"
        title="We couldn't load it"
        text="Something broke."
      >
        <button type="button">Try again</button>
      </StateAlert>,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load it")
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
