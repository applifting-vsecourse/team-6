import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignUpForm } from "@/features/auth/components/SignUpForm"

async function fillForm(password: string, passwordConfirmation: string) {
  await userEvent.type(screen.getByLabelText("Jméno"), "Jana Nováková")
  await userEvent.type(screen.getByLabelText("Uživatelské jméno"), "jana")
  await userEvent.type(screen.getByLabelText("E-mail"), "jana@novak.cz")
  await userEvent.type(screen.getByLabelText("Heslo"), password)
  await userEvent.type(screen.getByLabelText("Potvrzení hesla"), passwordConfirmation)
  await userEvent.click(screen.getByRole("button", { name: "Registrovat se" }))
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

    expect(await screen.findByText("Hesla se musí shodovat")).toBeInTheDocument()
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

    expect(await screen.findByText("Heslo musí mít alespoň 8 znaků")).toBeInTheDocument()
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
