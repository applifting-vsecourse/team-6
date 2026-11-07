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
      title="What I can teach"
      selectedTagIds={selected}
      allTags={tags}
      defaultSuggestedSlugs={["excel", "python"]}
      onSelectTag={(id) => setSelected((prev) => [...prev, id])}
      onRemoveTag={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
    />
  )
}

describe("TagSelector", () => {
  it("suggests three tags, the preferred ones first, and has no search box", () => {
    render(<Harness />)

    const added = screen.getAllByRole("button", { name: /^Add tag / })
    expect(added.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Add tag Excel",
      "Add tag Python",
      "Add tag Hiking",
    ])
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("brings the next suggestion in once one is picked", async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))

    expect(screen.getByRole("button", { name: "Remove tag Excel" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Add tag / })).toHaveLength(3)
    expect(screen.getByRole("button", { name: "Add tag Spanish" })).toBeInTheDocument()
  })
})
