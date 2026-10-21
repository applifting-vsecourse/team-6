import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignUpForm } from "@/features/auth/components/SignUpForm"

async function fillForm(password: string, passwordConfirmation: string) {
  await userEvent.type(screen.getByLabelText("Name"), "Jana Nováková")
  await userEvent.type(screen.getByLabelText("Username"), "jana")
  await userEvent.type(screen.getByLabelText("Email"), "jana@novak.cz")
  await userEvent.type(screen.getByLabelText("Password"), password)
  await userEvent.type(screen.getByLabelText("Confirm password"), passwordConfirmation)
  await userEvent.click(screen.getByRole("button", { name: "Sign up" }))
}

describe("SignUpForm", () => {
  it("rejects passwords that do not match", async () => {
    const onSubmit = vi.fn()
    render(
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await fillForm("tajneheslo", "jineheslo")

    expect(await screen.findByText("Passwords must match")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("rejects passwords shorter than 8 characters", async () => {
    const onSubmit = vi.fn()
    render(
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await fillForm("kratke", "kratke")

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits valid values", async () => {
    const onSubmit = vi.fn()
    render(
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await fillForm("tajneheslo", "tajneheslo")

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: "Jana Nováková",
        username: "jana",
        email: "jana@novak.cz",
        password: "tajneheslo",
        passwordConfirmation: "tajneheslo",
      },
      expect.anything(),
    )
  })
})
