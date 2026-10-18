import { isRedirect } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { Route } from "@/routes/login"

// Route.options.loader is a union with an object form; this route uses the plain function form.
const loader = Route.options.loader as (args: unknown) => Promise<unknown>

const runLoader = (session: unknown, from?: string) =>
  loader({
    context: { queryClient: { ensureQueryData: () => Promise.resolve(session) } },
    deps: { from },
  })

describe("login loader", () => {
  it("lets signed-out users see the form", async () => {
    await expect(runLoader(null)).resolves.toBeUndefined()
  })

  it("sends a signed-in user to Overview", async () => {
    const error = await runLoader({ user: {} }).catch((e: unknown) => e)
    expect(isRedirect(error) && error.options.to).toBe("/overview")
  })

  it("keeps the ?from= deep link for a signed-in user", async () => {
    const error = await runLoader({ user: {} }, encodeURIComponent("/profile")).catch(
      (e: unknown) => e,
    )
    expect(isRedirect(error) && error.options.to).toBe("/profile")
  })
})
