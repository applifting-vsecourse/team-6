import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CategoryFilter } from "@/features/kvintet/components/CategoryFilter"

const categories = [{ slug: "technology" }, { slug: "leisure" }]

describe("CategoryFilter", () => {
  it("lists All first, then the categories in the given order", () => {
    render(
      <CategoryFilter
        categories={categories}
        value={undefined}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getAllByRole("radio").map((chip) => chip.textContent)).toEqual([
      "All",
      "Technology",
      "Leisure",
    ])
    expect(screen.getByLabelText("Category")).toBeInTheDocument()
  })

  it("selects the chip of the current category", () => {
    render(
      <CategoryFilter
        categories={categories}
        value="leisure"
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("radio", { name: "Leisure" })).toHaveAttribute("data-state", "on")
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("data-state", "off")
  })

  it("reports a slug, or undefined for All", async () => {
    const onChange = vi.fn()
    render(
      <CategoryFilter
        categories={categories}
        value="leisure"
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByRole("radio", { name: "Technology" }))
    expect(onChange).toHaveBeenLastCalledWith("technology")

    await userEvent.click(screen.getByRole("radio", { name: "All" }))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
})
