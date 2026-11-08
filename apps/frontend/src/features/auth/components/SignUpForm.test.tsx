import type { ComponentProps } from "react"
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SignUpForm } from "./SignUpForm"

type FormExtras = Partial<ComponentProps<typeof SignUpForm>>

async function renderForm(onSubmit = vi.fn(), extras: FormExtras = {}) {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
        {...extras}
      />
    ),
  })
  // The link only gets an href when its target route exists.
  const codeOfConductRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/code-of-conduct",
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, codeOfConductRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "Create account" })
  return onSubmit
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Jan Novák")
  await user.type(screen.getByLabelText("Username"), "jan")
  await user.type(screen.getByLabelText("Email"), "jan@novak.cz")
  await user.type(screen.getByLabelText("Password"), "password1")
  await user.type(screen.getByLabelText("Confirm password"), "password1")
}

describe("SignUpForm code of conduct consent", () => {
  it("links to the code of conduct from the checkbox label", async () => {
    await renderForm()

    expect(screen.getByRole("link", { name: "community rules" })).toHaveAttribute(
      "href",
      "/code-of-conduct",
    )
  })

  it("cannot be submitted without ticking the checkbox", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)

    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Please agree to the rules first.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits the consent flag once the checkbox is ticked", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)

    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ acceptCodeOfConduct: true })
  })
})

describe("SignUpForm password rules", () => {
  it("rejects passwords that do not match", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)
    await user.clear(screen.getByLabelText("Confirm password"))
    await user.type(screen.getByLabelText("Confirm password"), "different1")
    await user.click(screen.getByRole("checkbox"))

    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Passwords must match")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("rejects passwords shorter than 8 characters", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)
    await user.clear(screen.getByLabelText("Password"))
    await user.clear(screen.getByLabelText("Confirm password"))
    await user.type(screen.getByLabelText("Password"), "short")
    await user.type(screen.getByLabelText("Confirm password"), "short")
    await user.click(screen.getByRole("checkbox"))

    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe("SignUpForm username preview", () => {
  it("reports the username as it is typed", async () => {
    const user = userEvent.setup()
    const onUsernameChange = vi.fn()
    await renderForm(vi.fn(), { onUsernameChange })

    await user.type(screen.getByLabelText("Username"), "jana")

    expect(onUsernameChange).toHaveBeenLastCalledWith("jana")
    expect(screen.getByLabelText("Username")).toHaveValue("jana")
  })
})

describe("SignUpForm taken e-mail", () => {
  it("shows the server's e-mail error under the field", async () => {
    await renderForm(vi.fn(), { emailError: "You already have an account with this email." })

    expect(await screen.findByText("You already have an account with this email.")).toBeVisible()
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
  })
})
