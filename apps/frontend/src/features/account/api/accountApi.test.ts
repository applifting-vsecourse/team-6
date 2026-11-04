import { describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { deleteAccount } from "./accountApi"

vi.mock("@/lib/api-client", () => ({
  api: {
    delete: vi.fn(),
  },
}))

describe("deleteAccount", () => {
  it("calls DELETE me and parses json response", async () => {
    vi.mocked(api.delete).mockReturnValue({
      json: () => Promise.resolve({ success: true }),
    } as never)

    const result = await deleteAccount()

    expect(api.delete).toHaveBeenCalledWith("me")
    expect(result).toEqual({ success: true })
  })
})
