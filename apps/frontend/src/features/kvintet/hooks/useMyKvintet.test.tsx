import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type * as KvintetApiModule from "@/features/kvintet/api/kvintetApi"
import { leaveKvintet, voteToStartKvintet } from "@/features/kvintet/api/kvintetApi"

import { useMyKvintet } from "./useMyKvintet"

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/features/kvintet/api/kvintetApi", async (importOriginal) => {
  const actual = await importOriginal<typeof KvintetApiModule>()
  return {
    ...actual,
    voteToStartKvintet: vi.fn(),
    leaveKvintet: vi.fn(),
  }
})

describe("useMyKvintet", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it("shows an error toast when voting fails", async () => {
    const error = new Error("Voting failed")
    vi.mocked(voteToStartKvintet).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useMyKvintet(), { wrapper })

    act(() => {
      result.current.vote()
    })

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred.")
    })
  })

  it("shows an error toast when leaving kvintet fails", async () => {
    const error = new Error("Leaving failed")
    vi.mocked(leaveKvintet).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useMyKvintet(), { wrapper })

    act(() => {
      result.current.leave()
    })

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred.")
    })
  })
})
