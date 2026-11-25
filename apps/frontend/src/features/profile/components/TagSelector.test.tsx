import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import i18n from "@/i18n"

import { TagSelector } from "./TagSelector"

const categories = [{ slug: "software-development" }, { slug: "business" }, { slug: "leisure" }]
const tags = [
  { id: "0", slug: "excel", categories: ["software-development", "business"] },
  { id: "1", slug: "python", categories: ["software-development"] },
  { id: "2", slug: "hiking", categories: ["leisure"] },
  { id: "3", slug: "sql", categories: ["software-development"] },
  { id: "4", slug: "bouldering", categories: [] },
  { id: "5", slug: "cycling", categories: [] },
  { id: "6", slug: "accounting", categories: [] },
  // No translation: shown, and so found, by its slug.
  { id: "7", slug: "underwater-basket-weaving", categories: [] },
]

function Harness({
  selectedAtStart = [] as string[],
  defaultCategory = undefined as string | undefined,
}) {
  const [selected, setSelected] = useState(selectedAtStart)
  return (
    <TagSelector
      selectedTagIds={selected}
      allTags={tags}
      categories={categories}
      defaultCategory={defaultCategory}
      onSelectTag={(id) => setSelected((prev) => [...prev, id])}
      onRemoveTag={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
    />
  )
}

afterEach(() => i18n.changeLanguage("en"))

describe("TagSelector", () => {
  it("shows the categories and the search, and no topic until a category is picked", () => {
    render(<Harness />)

    expect(screen.getByText("Category")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Software development" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Search topics" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()
  })

  it("opens on the default category, which can still be switched", async () => {
    render(<Harness defaultCategory="leisure" />)

    expect(screen.getByRole("button", { name: "Leisure" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Add tag Hiking" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Business" }))
    expect(screen.queryByRole("button", { name: "Add tag Hiking" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toBeInTheDocument()
  })

  it("opens on the chosen topic's category rather than the default, and ignores an unknown default", () => {
    const { unmount } = render(
      <Harness
        selectedAtStart={["1"]}
        defaultCategory="leisure"
      />,
    )
    expect(screen.getByRole("button", { name: "Software development" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    unmount()

    render(<Harness defaultCategory="nope" />)
    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()
  })

  it("lists the topics of the picked category", async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole("button", { name: "Business" }))

    expect(screen.getByRole("button", { name: "Business" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add tag Python" })).not.toBeInTheDocument()
  })

  it("moves a picked topic up among the chosen ones, and takes it back with its cross", async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole("button", { name: "Business" }))

    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))
    expect(screen.getByRole("button", { name: "Remove tag Excel" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add tag Excel" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove tag Excel" }))
    expect(screen.getByRole("button", { name: "Add tag Excel" })).toBeInTheDocument()
  })

  it("keeps a chosen topic visible when another category is open", async () => {
    render(<Harness selectedAtStart={["2"]} />)

    await userEvent.click(screen.getByRole("button", { name: "Business" }))

    expect(screen.getByRole("button", { name: "Remove tag Hiking" })).toBeInTheDocument()
  })

  it("finds a topic that has no category through the search", async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "boulder")
    await userEvent.click(screen.getByRole("button", { name: "Add tag Bouldering" }))

    expect(screen.getByRole("button", { name: "Remove tag Bouldering" })).toBeInTheDocument()
  })

  it("lists the categories above the search, which stays put, and empties after a pick", async () => {
    render(<Harness />)
    const search = screen.getByRole("textbox", { name: "Search topics" })

    expect(
      screen.getByText("Category").compareDocumentPosition(search) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    await userEvent.type(search, "py")
    expect(screen.getByText("Category")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Add tag Python" }))

    expect(search).toHaveValue("")
    expect(screen.getByText("Category")).toBeInTheDocument()
  })

  it("does not match the numeric id of a topic", async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "1")

    expect(screen.queryByRole("button", { name: /^Add tag / })).not.toBeInTheDocument()
    expect(screen.getByText("No topic found")).toBeInTheDocument()
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

  it("draws a line between the groups and what the open group holds, and none before one is open", async () => {
    const { container } = render(<Harness />)
    expect(container.querySelector("[data-slot=separator]")).toBeNull()

    await userEvent.click(screen.getByRole("button", { name: "Business" }))

    const line = container.querySelector("[data-slot=separator]")
    expect(line).not.toBeNull()
    // Between the group chips above it and the items below it.
    expect(
      screen.getByRole("button", { name: "Business" }).compareDocumentPosition(line as Node),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(
      line?.compareDocumentPosition(screen.getByRole("button", { name: "Add tag Excel" })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it("searches the label the user sees, not the English slug behind it", async () => {
    await i18n.changeLanguage("cs")
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Hledat témata" }), "g")

    // "cycling" and "accounting" have a g in the slug, "Cyklistika" and "Účetnictví" in no way.
    expect(screen.getByRole("button", { name: /Bouldering/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Cyklistika/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Účetnictví/ })).not.toBeInTheDocument()
  })

  it("ignores diacritics and case", async () => {
    await i18n.changeLanguage("cs")
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Hledat témata" }), "UCETNICTVI")

    expect(screen.getByRole("button", { name: /Účetnictví/ })).toBeInTheDocument()
  })

  it("finds a topic without a translation by its slug", async () => {
    render(<Harness />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search topics" }), "basket")

    expect(screen.getByRole("button", { name: /underwater-basket-weaving/ })).toBeInTheDocument()
  })
})
