import type { QueryClient } from "@tanstack/react-query"
import { isRedirect } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { requireOnboarded } from "@/app/requireOnboarded"
import { Route as BeginsRoute } from "@/routes/_ProtectedPages/kvintet.begins"
import { Route as FeedRoute } from "@/routes/_ProtectedPages/kvintet.feed"
import { Route as MessagesRoute } from "@/routes/_ProtectedPages/kvintet.messages"

const run = (profile: unknown) =>
  requireOnboarded({
    context: {
      queryClient: {
        ensureQueryData: (options: { queryKey: readonly unknown[] }) =>
          Promise.resolve(options.queryKey[0] === "profile" ? profile : { user: { id: "u1" } }),
      } as unknown as QueryClient,
    },
  })

describe("requireOnboarded", () => {
  it("lets a user with a finished profile through", async () => {
    await expect(run({ onboardingCompletedAt: "2026-10-21T12:00:00Z" })).resolves.toBeUndefined()
  })

  it.each([
    ["an unfinished profile", { onboardingCompletedAt: null }],
    ["no profile", null],
  ])("sends a user with %s to Home", async (_name, profile) => {
    const error = await run(profile).catch((e: unknown) => e)
    expect(isRedirect(error) && error.options.to).toBe("/overview")
  })

  it("lets a failed profile fetch through to the error component", async () => {
    const failure = new Error("network")
    const error = await requireOnboarded({
      context: { queryClient: { ensureQueryData: () => Promise.reject(failure) } as never },
    }).catch((e: unknown) => e)
    expect(error).toBe(failure)
  })

  it("guards the kvintet pages the server limits to onboarded users", () => {
    for (const route of [FeedRoute, MessagesRoute, BeginsRoute]) {
      expect(route.options.beforeLoad).toBe(requireOnboarded)
    }
  })
})
