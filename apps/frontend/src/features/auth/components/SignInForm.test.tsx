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

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Email is required")).toBeInTheDocument()
    expect(screen.getByText("Password is required")).toBeInTheDocument()
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

    await userEvent.type(screen.getByLabelText("Email"), "  jana@novak.cz ")
    await userEvent.type(screen.getByLabelText("Password"), " tajneheslo  ")
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(onSubmit).toHaveBeenCalledWith(
      { email: "jana@novak.cz", password: "tajneheslo" },
      expect.anything(),
    )
  })

  it("shows a server error in an alert and disables submit while loading", () => {
    render(
      <SignInForm
        isLoading
        errorMessage="Sign in failed"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Sign in failed")
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled()
  })
})
