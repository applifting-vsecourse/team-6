import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { AdminStatsPage } from "./AdminStatsPage"

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))

const stats = {
  users: { registered: 21, onboarded: 15, activeToday: 4 },
  kvintets: { total: 6, active: 1, formingSmall: 3, formingReady: 2 },
}

const respondWith = (json: () => Promise<unknown>) =>
  vi.mocked(api.get).mockReturnValue({ json } as never)

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AdminStatsPage />
    </QueryClientProvider>,
  )

const valueOf = (label: string) => screen.getByText(label).nextElementSibling

describe("AdminStatsPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows every aggregated number next to its label", async () => {
    respondWith(() => Promise.resolve(stats))
    renderPage()

    expect(await screen.findByText("21")).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith("admin/stats")
    expect(valueOf("Registered")).toHaveTextContent("21")
    expect(valueOf("Finished their profile")).toHaveTextContent("15")
    expect(valueOf("Signed in today")).toHaveTextContent("4")
    expect(valueOf("All kvintets")).toHaveTextContent("6")
    expect(valueOf("Started")).toHaveTextContent("1")
    expect(valueOf("Forming, 1–2 people")).toHaveTextContent("3")
    expect(valueOf("Forming, 3–4 people (can vote to start)")).toHaveTextContent("2")
  })

  it("says the numbers failed to load and retries on request", async () => {
    respondWith(() => Promise.reject(new Error("boom")))
    renderPage()

    expect(await screen.findByRole("alert")).toHaveTextContent("The numbers could not be loaded")

    respondWith(() => Promise.resolve(stats))
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("21")).toBeInTheDocument()
  })
})
