import type { ComponentType, ReactNode } from "react"
import type * as ReactRouter from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Route } from "@/routes/signup"

const signUp = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock("@/features/auth/hooks/useSignUp", () => ({
  useSignUp: () => ({ mutateAsync: signUp.mutateAsync, isPending: false }),
}))
// The app header needs a session and a router; neither matters for this page.
vi.mock("@/features/auth/components/AppHeader", () => ({ AppHeader: () => null }))
// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouter>()),
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

const SignUpPage = Route.options.component as ComponentType

// BetterAuth errors reach the page as Errors carrying a `code`, see `toAuthError`.
const authError = (code: string) => Object.assign(new Error("Auth request failed"), { code })

async function submitForm() {
  const user = userEvent.setup()
  render(<SignUpPage />)
  await user.type(screen.getByLabelText("Name"), "Jan Novák")
  await user.type(screen.getByLabelText("Username"), "jan")
  await user.type(screen.getByLabelText("Email"), "jan@novak.cz")
  await user.type(screen.getByLabelText("Password"), "password1")
  await user.click(screen.getByRole("checkbox"))
  await user.click(screen.getByRole("button", { name: "Create account" }))
}

describe("SignUpPage server errors", () => {
  beforeEach(() => {
    signUp.mutateAsync.mockReset()
  })

  it.each(["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"])(
    "shows %s under the e-mail field, not in the alert",
    async (code) => {
      signUp.mutateAsync.mockRejectedValue(authError(code))

      await submitForm()

      expect(
        await screen.findByText("You already have an account with this email. Try signing in."),
      ).toBeVisible()
      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    },
  )

  it("keeps any other error in the alert", async () => {
    signUp.mutateAsync.mockRejectedValue(authError("SOMETHING_ELSE"))

    await submitForm()

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign up failed")
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid", "true")
  })

  it("survives a rejection that is not an Error", async () => {
    signUp.mutateAsync.mockRejectedValue(undefined)

    await submitForm()

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign up failed")
  })
})
