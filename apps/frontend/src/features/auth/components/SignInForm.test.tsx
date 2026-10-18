import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignInForm } from "@/features/auth/components/SignInForm"

describe("SignInForm", () => {
  it("submits the entered e-mail and password", async () => {
    const onSubmit = vi.fn()
    render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.type(screen.getByLabelText("Email"), "a@b.cz")
    await userEvent.type(screen.getByLabelText("Password"), "secret")
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(onSubmit).toHaveBeenCalledWith(
      { email: "a@b.cz", password: "secret" },
      expect.anything(),
    )
  })

  it("does not submit an empty form", async () => {
    const onSubmit = vi.fn()
    render(
      <SignInForm
        isLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText("Email is required")).toBeInTheDocument()
  })
})
