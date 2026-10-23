import { HTTPError } from "ky"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { myKvintetQueryOptions } from "./kvintetApi"

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))

const apiError = (status: number, code: string) =>
  Object.assign(
    new HTTPError(new Response(null, { status }), new Request("http://api.test"), {} as never),
    { data: { code } },
  )

const fetchMine = () => myKvintetQueryOptions().queryFn?.({} as never)

describe("myKvintetQueryOptions", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
  })

  it("maps the guard's forbidden code to no kvintet", async () => {
    vi.mocked(api.get).mockReturnValue({
      json: () => Promise.reject(apiError(403, "forbidden")),
    } as never)

    await expect(fetchMine()).resolves.toBeNull()
  })

  it.each([
    [403, "not_onboarded"],
    [404, "not_found"],
  ])("lets a %i %s error surface instead of showing the empty state", async (status, code) => {
    vi.mocked(api.get).mockReturnValue({
      json: () => Promise.reject(apiError(status, code)),
    } as never)

    await expect(fetchMine()).rejects.toBeInstanceOf(HTTPError)
  })
})
