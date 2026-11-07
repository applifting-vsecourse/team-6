import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { FeedFilters } from "@/features/kvintet/components/FeedFilters"
import type { Frequency } from "@/features/kvintet/lib/frequencies"

const categories = [{ slug: "software-development" }, { slug: "leisure" }]

const stubDesktop = (isDesktop: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: isDesktop,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )

const renderFilters = (
  props: { category?: string[]; frequency?: Frequency[] } = {},
  handlers = { onCategoryChange: vi.fn(), onFrequencyChange: vi.fn() },
) => {
  render(
    <FeedFilters
      categories={categories}
      category={props.category ?? []}
      frequency={props.frequency ?? []}
      {...handlers}
    />,
  )
  return handlers
}

afterEach(() => vi.unstubAllGlobals())

describe("FeedFilters on a phone", () => {
  it("lists All first, then the categories, in a named row", () => {
    renderFilters()

    const row = screen.getByRole("group", { name: "Topic" })
    expect(
      within(row)
        .getAllByRole("button")
        .map((chip) => chip.textContent),
    ).toEqual(["All", "Software development", "Leisure"])
    expect(within(row).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true")
  })

  it("has a second row for how often", () => {
    renderFilters()

    const row = screen.getByRole("group", { name: "How often" })
    expect(
      within(row)
        .getAllByRole("button")
        .map((chip) => chip.textContent),
    ).toEqual(["All", "Every week", "Every two weeks", "Once a month"])
  })

  it("marks every picked chip and un-marks All", () => {
    renderFilters({ category: ["leisure", "software-development"] })

    const row = screen.getByRole("group", { name: "Topic" })
    expect(within(row).getByRole("button", { name: "Leisure" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(within(row).getByRole("button", { name: "Software development" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(within(row).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("adds a chip to the picked ones, removes it again, and clears the row with All", async () => {
    const { onCategoryChange } = renderFilters({ category: ["leisure"] })
    const row = screen.getByRole("group", { name: "Topic" })

    await userEvent.click(within(row).getByRole("button", { name: "Software development" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith(["leisure", "software-development"])

    await userEvent.click(within(row).getByRole("button", { name: "Leisure" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith([])

    await userEvent.click(within(row).getByRole("button", { name: "All" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith([])
  })

  it("reports a picked frequency", async () => {
    const { onFrequencyChange } = renderFilters()

    await userEvent.click(screen.getByRole("button", { name: "Every two weeks" }))

    expect(onFrequencyChange).toHaveBeenCalledWith(["BIWEEKLY"])
  })
})

describe("FeedFilters on a desktop", () => {
  it("shows two titled checkbox lists instead of chips", () => {
    stubDesktop(true)
    renderFilters({ category: ["leisure"], frequency: ["WEEKLY"] })

    const topic = screen.getByRole("group", { name: "Topic" })
    expect(
      within(topic)
        .getAllByRole("checkbox")
        .map((box) => box.getAttribute("aria-checked")),
    ).toEqual(["false", "true"])
    expect(within(topic).getByRole("checkbox", { name: "Leisure" })).toBeChecked()
    expect(
      within(screen.getByRole("group", { name: "How often" })).getByRole("checkbox", {
        name: "Every week",
      }),
    ).toBeChecked()
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument()
  })

  it("lets several boxes be ticked at once", async () => {
    stubDesktop(true)
    const { onCategoryChange, onFrequencyChange } = renderFilters({ category: ["leisure"] })

    await userEvent.click(screen.getByRole("checkbox", { name: "Software development" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith(["leisure", "software-development"])

    await userEvent.click(screen.getByRole("checkbox", { name: "Leisure" }))
    expect(onCategoryChange).toHaveBeenLastCalledWith([])

    await userEvent.click(screen.getByRole("checkbox", { name: "Once a month" }))
    expect(onFrequencyChange).toHaveBeenLastCalledWith(["MONTHLY"])
  })
})
