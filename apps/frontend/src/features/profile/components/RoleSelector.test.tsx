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

    expect(screen.queryByRole("button", { name: "Select role Copywriter" })).not.toBeInTheDocument()

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

  it("marks a chosen role as pressed and removes it on a second click", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Design" }))
    await userEvent.click(screen.getByRole("button", { name: "Select role UX Designer" }))

    const chosen = screen.getByRole("button", { name: "Remove role UX Designer" })
    expect(chosen).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(chosen)

    expect(screen.getByRole("button", { name: "Select role UX Designer" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
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
  })

  it("finds a role of any field with the search", async () => {
    render(<Selector />)

    await userEvent.click(screen.getByRole("button", { name: "Not here? Search all roles" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Search role" }), "teacher")
    await userEvent.click(screen.getByRole("button", { name: "Select role Teacher / Tutor" }))

    expect(screen.getByRole("button", { name: "Remove role Teacher / Tutor" })).toBeInTheDocument()
  })
})
