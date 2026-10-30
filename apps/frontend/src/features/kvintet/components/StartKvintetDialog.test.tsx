import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }))

const reference = {
  categories: [
    { slug: "software-development" },
    { slug: "business" },
    { slug: "languages" },
    { slug: "leisure" },
  ],
}

const renderDialog = (defaultCategory?: string) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <StartKvintetDialog
        isOpen
        onOpenChange={vi.fn()}
        defaultCategory={defaultCategory}
      />
    </QueryClientProvider>,
  )

const category = async (name: string) =>
  within(screen.getByRole("group", { name: "Categories" })).findByRole("button", { name })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve(reference) } as never)
  vi.mocked(api.post).mockResolvedValue(undefined as never)
})

describe("StartKvintetDialog", () => {
  it("disables a fourth category until one of the three is unpicked, then sends the chosen ones", async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText("Topic or problem"), "Topic")

    for (const name of ["Software development", "Business", "Languages"]) {
      await userEvent.click(await category(name))
    }
    expect(await category("Leisure")).toBeDisabled()

    // Swap Business for Leisure.
    await userEvent.click(await category("Business"))
    expect(await category("Leisure")).toBeEnabled()
    await userEvent.click(await category("Leisure"))
    await userEvent.click(screen.getByRole("button", { name: "Start proposal" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: { title: "Topic", categorySlugs: ["software-development", "languages", "leisure"] },
      }),
    )
  })

  it("preselects the category it was opened with", async () => {
    renderDialog("languages")

    expect(await category("Languages")).toHaveAttribute("aria-pressed", "true")
    expect(await category("Business")).toHaveAttribute("aria-pressed", "false")
  })
})
