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

const renderDialog = (avatarSeed: string | undefined = "jana") =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <StartKvintetDialog
        isOpen
        avatarSeed={avatarSeed}
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve(reference) } as never)
  vi.mocked(api.post).mockResolvedValue(undefined as never)
})

describe("StartKvintetDialog", () => {
  it("offers the categories in one select and sends the chosen one as a list", async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText("What do you want to talk about"), "Topic")

    await userEvent.click(screen.getByRole("combobox", { name: "Category" }))
    const listbox = await screen.findByRole("listbox")
    expect(
      within(listbox)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Software development", "Business", "Languages", "Leisure"])
    await userEvent.click(within(listbox).getByRole("option", { name: "Languages" }))
    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: { title: "Topic", categorySlugs: ["languages"] },
      }),
    )
  })

  it("explains what the others will see, and shows the person starting it", () => {
    renderDialog()

    expect(
      screen.getByText("You'll be its first member. Others join by topic."),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Others will see the topic and your role. Your name only once the group starts.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog").querySelector("[data-slot='avatar']")).not.toBeNull()
  })

  it("has no avatar when nobody is signed in", () => {
    renderDialog("")

    expect(screen.getByRole("dialog").querySelector("[data-slot='avatar']")).toBeNull()
  })
})
