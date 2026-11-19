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
  it("shows the roles of a field only after the field is picked", async () => {
    render(<Selector />)

    expect(screen.queryByRole("checkbox", { name: "Copywriter" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Marketing & sales" }))

    expect(screen.getByRole("button", { name: "Marketing & sales" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("checkbox", { name: "Copywriter" })).toBeInTheDocument()
    expect(screen.queryByRole("checkbox", { name: "Software Engineer" })).not.toBeInTheDocument()
    expect(screen.getByText("Role in Marketing & sales")).toBeInTheDocument()
  })

  it("ticks a role and unticks it on a second click", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Design" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "UX Designer" }))
    expect(screen.getByRole("checkbox", { name: "UX Designer" })).toBeChecked()

    await userEvent.click(screen.getByRole("checkbox", { name: "UX Designer" }))

    expect(screen.getByRole("checkbox", { name: "UX Designer" })).not.toBeChecked()
  })

  it("lets a person pick more than one role", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Design" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "UX Designer" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "UI Designer" }))

    expect(screen.getByRole("checkbox", { name: "UX Designer" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "UI Designer" })).toBeChecked()
  })

  it("opens on the field of an already chosen role", () => {
    render(<Selector initial={["copywriter"]} />)

    expect(screen.getByRole("button", { name: "Marketing & sales" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("checkbox", { name: "Copywriter" })).toBeChecked()
  })

  it("keeps a chosen role on the list when another field is open", async () => {
    render(<Selector initial={["copywriter"]} />)

    await userEvent.click(screen.getByRole("button", { name: "Design" }))

    expect(screen.getByRole("checkbox", { name: "Copywriter" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "UX Designer" })).not.toBeChecked()
  })

  it("lists no role until something is typed in the search", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Not here? Search all roles" }))

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("finds a role of any field with the search", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Not here? Search all roles" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Search role" }), "teacher")
    await userEvent.click(screen.getByRole("checkbox", { name: "Teacher / Tutor" }))

    expect(screen.getByRole("checkbox", { name: "Teacher / Tutor" })).toBeChecked()
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

    await userEvent.click(screen.getByRole("button", { name: "Not here? Search all roles" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Search role" }), "teacher{Enter}")

    expect(isSubmitted).toBe(false)
  })
})
