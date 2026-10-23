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

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

async function renderForm(onSubmit = vi.fn()) {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <SignUpForm
        isLoading={false}
        onSubmit={onSubmit}
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
  await screen.findByRole("button", { name: "Sign up" })
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

    expect(screen.getByRole("link", { name: "code of conduct" })).toHaveAttribute(
      "href",
      "/code-of-conduct",
    )
  })

  it("cannot be submitted without ticking the checkbox", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)

    await user.click(screen.getByRole("button", { name: "Sign up" }))

    expect(await screen.findByText("You must accept the code of conduct")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits the consent flag once the checkbox is ticked", async () => {
    const user = userEvent.setup()
    const onSubmit = await renderForm()
    await fillRequiredFields(user)

    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Sign up" }))

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

    await user.click(screen.getByRole("button", { name: "Sign up" }))

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

    await user.click(screen.getByRole("button", { name: "Sign up" }))

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe("SignUpForm avatar preview", () => {
  it("updates the avatar preview as the username is typed", async () => {
    const user = userEvent.setup()
    await renderForm()
    const preview = () => document.querySelector("[data-slot=avatar]")?.innerHTML

    await user.type(screen.getByLabelText("Username"), "jana")
    const before = preview()
    await user.type(screen.getByLabelText("Username"), "2")

    expect(before).toBeTruthy()
    expect(preview()).not.toBe(before)
  })
})
