import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { TagSelector } from "./TagSelector"

const tags = ["excel", "python", "hiking", "spanish", "sql"].map((slug, i) => ({
  id: String(i),
  slug,
}))

function Harness() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <TagSelector
      selectedTagIds={selected}
      allTags={tags}
      defaultSuggestedSlugs={["excel", "python"]}
      onSelectTag={(id) => setSelected((prev) => [...prev, id])}
      onRemoveTag={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
    />
  )
}

describe("TagSelector", () => {
  it("suggests three topics, the preferred ones first", () => {
    render(<Harness />)

    const added = screen.getAllByRole("button", { name: /^Add tag / })
    expect(added.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Add tag Excel",
      "Add tag Python",
      "Add tag Hiking",
    ])
    expect(screen.getByText("Suggested for you")).toBeInTheDocument()
  })

  it("brings the next suggestion in once one is picked", async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))

    expect(screen.getByRole("button", { name: "Remove tag Excel" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Add tag / })).toHaveLength(3)
    expect(screen.getByRole("button", { name: "Add tag Spanish" })).toBeInTheDocument()
  })

  it("takes a chosen topic away with its cross", async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))

    await userEvent.click(screen.getByRole("button", { name: "Remove tag Excel" }))

    expect(screen.queryByRole("button", { name: "Remove tag Excel" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toBeInTheDocument()
  })

  it("searches our topics, and the suggestions step aside while it does", async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "sp")

    expect(screen.getByRole("button", { name: "Add tag Spanish" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add tag Excel" })).not.toBeInTheDocument()
    expect(screen.queryByText("Suggested for you")).not.toBeInTheDocument()
  })

  it("empties the search once a topic is picked from it", async () => {
    render(<Harness />)
    const search = screen.getByRole("textbox", { name: "Search topics" })
    await userEvent.type(search, "sp")

    await userEvent.click(screen.getByRole("button", { name: "Add tag Spanish" }))

    expect(search).toHaveValue("")
    expect(screen.getByRole("button", { name: "Remove tag Spanish" })).toBeInTheDocument()
  })

  it("says so when nothing matches, and never offers to create a topic", async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "zzz")

    expect(screen.getByText("No topic found")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()
  })

  it("does not continue the onboarding when Enter is pressed in the search", async () => {
    let isSubmitted = false
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          isSubmitted = true
        }}
      >
        <Harness />
      </form>,
    )

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "sp{Enter}")

    expect(isSubmitted).toBe(false)
  })
})
