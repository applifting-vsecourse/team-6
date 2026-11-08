import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type * as KvintetApiModule from "@/features/kvintet/api/kvintetApi"
import { markBeginsSeen } from "@/features/kvintet/api/kvintetApi"
import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

import { useMarkBeginsSeen } from "./useMarkBeginsSeen"

vi.mock("@/features/kvintet/api/kvintetApi", async (importOriginal) => {
  const actual = await importOriginal<typeof KvintetApiModule>()
  return { ...actual, markBeginsSeen: vi.fn() }
})

describe("useMarkBeginsSeen", () => {
  it("marks the cached kvintet as seen at once and tells the server", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(kvintetKeys.mine(), { id: "k1", beginsSeen: false })
    vi.mocked(markBeginsSeen).mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useMarkBeginsSeen(), { wrapper })
    act(() => result.current.mutate())

    expect(queryClient.getQueryData<{ beginsSeen: boolean }>(kvintetKeys.mine())?.beginsSeen).toBe(
      true,
    )
    await vi.waitFor(() => expect(markBeginsSeen).toHaveBeenCalledTimes(1))
  })

  it("leaves an empty cache alone", () => {
    const queryClient = new QueryClient()
    vi.mocked(markBeginsSeen).mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useMarkBeginsSeen(), { wrapper })
    act(() => result.current.mutate())

    expect(queryClient.getQueryData(kvintetKeys.mine())).toBeUndefined()
  })
})
