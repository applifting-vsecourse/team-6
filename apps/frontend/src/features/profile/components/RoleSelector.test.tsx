import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RoleSelector } from "./RoleSelector"

function Selector({ initial = [] }: { initial?: string[] }) {
  const [roles, setRoles] = useState(initial)
  return (
    <RoleSelector
      selectedRoles={roles}
      onSelectRole={(role) => setRoles((prev) => [...prev, role])}
      onRemoveRole={(role) => setRoles((prev) => prev.filter((r) => r !== role))}
    />
  )
}

describe("RoleSelector", () => {
  it("is the same picker as the topics: fields to browse and a search, no role until a field is open", () => {
    render(<Selector />)

    expect(screen.getByText("Field")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Marketing & sales" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Search role" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Select role / })).not.toBeInTheDocument()
  })

  it("shows the roles of a field only after the field is picked", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Marketing & sales" }))

    expect(screen.getByRole("button", { name: "Marketing & sales" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Select role Copywriter" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Select role Software Engineer" }),
    ).not.toBeInTheDocument()
  })

  it("moves a chosen role up among the chosen ones and takes it back with its cross", async () => {
    render(<Selector />)
    await userEvent.click(screen.getByRole("button", { name: "Design" }))

    await userEvent.click(screen.getByRole("button", { name: "Select role UX Designer" }))
    expect(screen.getByRole("button", { name: "Remove role UX Designer" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Select role UX Designer" }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove role UX Designer" }))
    expect(screen.getByRole("button", { name: "Select role UX Designer" })).toBeInTheDocument()
  })

  it("lets a person pick more than one role", async () => {
    render(<Selector />)
    await userEvent.click(screen.getByRole("button", { name: "Design" }))

    await userEvent.click(screen.getByRole("button", { name: "Select role UX Designer" }))
    await userEvent.click(screen.getByRole("button", { name: "Select role UI Designer" }))

    expect(screen.getByRole("button", { name: "Remove role UX Designer" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove role UI Designer" })).toBeInTheDocument()
  })

  it("opens on the field of an already chosen role", () => {
    render(<Selector initial={["copywriter"]} />)

    expect(screen.getByRole("button", { name: "Marketing & sales" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Remove role Copywriter" })).toBeInTheDocument()
  })

  it("keeps a chosen role visible when another field is open", async () => {
    render(<Selector initial={["copywriter"]} />)

    await userEvent.click(screen.getByRole("button", { name: "Design" }))

    expect(screen.getByRole("button", { name: "Remove role Copywriter" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Select role UX Designer" })).toBeInTheDocument()
  })

  it("lists no role until something is typed in the search", () => {
    render(<Selector />)

    expect(screen.queryByRole("button", { name: /^Select role / })).not.toBeInTheDocument()
  })

  it("finds a role of any field with the search, and empties it after the pick", async () => {
    render(<Selector />)
    const search = screen.getByRole("textbox", { name: "Search role" })

    await userEvent.type(search, "teacher")
    await userEvent.click(screen.getByRole("button", { name: "Select role Teacher / Tutor" }))

    expect(screen.getByRole("button", { name: "Remove role Teacher / Tutor" })).toBeInTheDocument()
    expect(search).toHaveValue("")
  })

  it("says so when no role matches", async () => {
    render(<Selector />)

    await userEvent.type(screen.getByRole("textbox", { name: "Search role" }), "zzz")

    expect(screen.getByText("No role found")).toBeInTheDocument()
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
        <Selector />
      </form>,
    )

    await userEvent.type(screen.getByRole("textbox", { name: "Search role" }), "teacher{Enter}")

    expect(isSubmitted).toBe(false)
  })

  it("draws a line between the groups and what the open group holds, and none before one is open", async () => {
    const { container } = render(<Selector />)
    expect(container.querySelector("[data-slot=separator]")).toBeNull()

    await userEvent.click(screen.getByRole("button", { name: "Design" }))

    const line = container.querySelector("[data-slot=separator]")
    expect(line).not.toBeNull()
    // Between the group chips above it and the items below it.
    expect(
      screen.getByRole("button", { name: "Design" }).compareDocumentPosition(line as Node),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(
      line?.compareDocumentPosition(
        screen.getByRole("button", { name: "Select role UX Designer" }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
