import { isRedirect } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { Route } from "@/routes/login"

// Route.options.loader is a union with an object form; this route uses the plain function form.
const loader = Route.options.loader as (args: unknown) => Promise<unknown>

const runLoader = (
  session: unknown,
  from?: string,
  profile: unknown = { onboardingCompletedAt: "2026-10-21T12:00:00Z" },
) =>
  loader({
    context: {
      queryClient: {
        ensureQueryData: (options: { queryKey: readonly unknown[] }) => {
          if (options.queryKey[0] === "profile") {
            return Promise.resolve(profile)
          }
          return Promise.resolve(session)
        },
      },
    },
    deps: { from },
  })

describe("login loader", () => {
  it("lets signed-out users see the form", async () => {
    await expect(runLoader(null)).resolves.toBeUndefined()
  })

  it("sends a signed-in user who has completed onboarding to Overview", async () => {
    const error = await runLoader({ user: {} }).catch((e: unknown) => e)
    expect(isRedirect(error) && error.options.to).toBe("/overview")
  })

  it("sends a signed-in user who has not completed onboarding to Onboarding", async () => {
    const error = await runLoader({ user: {} }, encodeURIComponent("/profile"), null).catch(
      (e: unknown) => e,
    )
    expect(isRedirect(error) && error.options.to).toBe("/onboarding")
  })

  it("keeps the ?from= deep link for a signed-in onboarded user", async () => {
    const error = await runLoader({ user: {} }, encodeURIComponent("/profile")).catch(
      (e: unknown) => e,
    )
    expect(isRedirect(error) && error.options.to).toBe("/profile")
  })

  it("passes the query string of the deep link as search, not inside the path", async () => {
    const error = await runLoader({ user: {} }, encodeURIComponent("/profile?tab=2")).catch(
      (e: unknown) => e,
    )
    expect(isRedirect(error) && error.options.to).toBe("/profile")
    expect(isRedirect(error) && error.options.search).toEqual({ tab: "2" })
  })
})
