import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { TagSelector } from "./TagSelector"

const categories = [{ slug: "software-development" }, { slug: "business" }, { slug: "leisure" }]
const tags = [
  { id: "0", slug: "excel", categories: ["software-development", "business"] },
  { id: "1", slug: "python", categories: ["software-development"] },
  { id: "2", slug: "hiking", categories: ["leisure"] },
  { id: "3", slug: "sql", categories: ["software-development"] },
  { id: "4", slug: "bouldering", categories: [] },
]

function Harness() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <TagSelector
      title="What I can teach"
      selectedTagIds={selected}
      allTags={tags}
      categories={categories}
      onSelectTag={(id) => setSelected((prev) => [...prev, id])}
      onRemoveTag={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
    />
  )
}

describe("TagSelector", () => {
  it("shows only the categories until one is picked", () => {
    render(<Harness />)

    expect(screen.getByRole("button", { name: "Software development" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()
  })

  it("lists the tags of the picked category and toggles them", async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole("button", { name: "Business" }))
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add tag Python" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))
    const chosen = screen.getByRole("button", { name: "Remove tag Excel" })
    expect(chosen).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(chosen)
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("finds a tag without a category through the search", async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole("button", { name: "Not here? Search all tags" }))
    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search tags in What I can teach" }),
      "boulder",
    )
    await userEvent.click(screen.getByRole("button", { name: "Add tag Bouldering" }))

    expect(screen.getByRole("button", { name: "Remove tag Bouldering" })).toBeInTheDocument()
  })
})
