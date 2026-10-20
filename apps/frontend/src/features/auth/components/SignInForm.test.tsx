import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignInForm } from "@/features/auth/components/SignInForm"

describe("SignInForm", () => {
  it("shows field errors under the inputs instead of submitting an empty form", async () => {
    const onSubmit = vi.fn()
    render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Přihlásit se" }))

    expect(await screen.findByText("Zadejte e-mail")).toBeInTheDocument()
    expect(screen.getByText("Zadejte heslo")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits trimmed credentials", async () => {
    const onSubmit = vi.fn()
    render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.type(screen.getByLabelText("E-mail"), "  jana@novak.cz ")
    await userEvent.type(screen.getByLabelText("Heslo"), " tajneheslo  ")
    await userEvent.click(screen.getByRole("button", { name: "Přihlásit se" }))

    expect(onSubmit).toHaveBeenCalledWith(
      { email: "jana@novak.cz", password: "tajneheslo" },
      expect.anything(),
    )
  })

  it("shows a server error in an alert and disables submit while loading", () => {
    render(
      <SignInForm
        isLoading
        errorMessage="Přihlášení se nezdařilo."
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Přihlášení se nezdařilo.")
    expect(screen.getByRole("button", { name: "Přihlásit se" })).toBeDisabled()
  })
})
