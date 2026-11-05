import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AnonymousBlobatar, KvintetSeats } from "@/components/KvintetSeats"

const GREY = /ced4de/i

const html = (ui: React.ReactElement) => render(ui).container.innerHTML

describe("AnonymousBlobatar", () => {
  it("is grey, while a normal blobatar is not", () => {
    expect(html(<AnonymousBlobatar seed="seat-1" />)).toMatch(GREY)
    expect(html(<KvintetSeats members={[{ seed: "seat-1" }]} />)).not.toMatch(GREY)
  })
})

describe("KvintetSeats", () => {
  it("fills the free seats with dashed circles up to five", () => {
    const { container } = render(
      <KvintetSeats members={[{ seed: "a" }, { seed: "b", anonymous: true }]} />,
    )

    expect(container.querySelectorAll(".border-dashed")).toHaveLength(3)
    expect(container.innerHTML).toMatch(GREY)
  })

  it("shows five dashed circles for an empty group and none for a full one", () => {
    const empty = render(<KvintetSeats members={[]} />).container
    expect(empty.querySelectorAll(".border-dashed")).toHaveLength(5)

    const full = render(
      <KvintetSeats members={Array.from({ length: 5 }, (_, i) => ({ seed: `m${i}` }))} />,
    ).container
    expect(full.querySelectorAll(".border-dashed")).toHaveLength(0)
  })

  it("lays the ring out as five placed seats and labels it only when asked", () => {
    const { container } = render(
      <KvintetSeats
        layout="ring"
        label="Your kvintet"
        members={[{ seed: "a" }]}
      />,
    )

    expect(container.querySelectorAll(".absolute")).toHaveLength(5)
    expect(container.firstElementChild).toHaveAttribute("aria-label", "Your kvintet")
    expect(render(<KvintetSeats members={[]} />).container.firstElementChild).not.toHaveAttribute(
      "aria-label",
    )
  })
})
