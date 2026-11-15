import { QueryClient } from "@tanstack/react-query"
import { isNotFound } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { authSessionQueryOptions, type Session } from "@/features/auth/api/authSessionQueryOptions"

import { Route } from "./admin"

const load = (role: string) => {
  const queryClient = new QueryClient()
  const session: Session = { user: { id: "u1", email: "a@b.cz", name: "A", username: "a", role } }
  queryClient.setQueryData(authSessionQueryOptions().queryKey, session)
  const loader = Route.options.loader as (ctx: {
    context: { queryClient: QueryClient }
  }) => Promise<void>
  return loader({ context: { queryClient } })
}

describe("/admin", () => {
  it("is a 404 for a regular user", async () => {
    await expect(load("user")).rejects.toSatisfy(isNotFound)
  })

  it("opens for an admin", async () => {
    await expect(load("admin")).resolves.toBeUndefined()
  })
})
