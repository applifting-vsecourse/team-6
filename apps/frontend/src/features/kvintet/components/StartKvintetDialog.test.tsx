import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))
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

const typeTopicAndDescription = async () => {
  await userEvent.type(screen.getByLabelText("What do you want to talk about"), "Topic")
  await userEvent.type(screen.getByLabelText("Description"), "We talk together.")
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
  it("offers the categories as chips and sends the chosen ones as a list", async () => {
    renderDialog()
    await typeTopicAndDescription()

    const group = screen.getByRole("group", { name: "Categories (1–3)" })
    expect(
      within(group)
        .getAllByRole("button")
        .map((chip) => chip.textContent),
    ).toEqual(["Software development", "Business", "Languages", "Leisure"])
    await userEvent.click(within(group).getByRole("button", { name: "Languages" }))
    expect(within(group).getByRole("button", { name: "Languages" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: { title: "Topic", categorySlugs: ["languages"], description: "We talk together." },
      }),
    )
  })

  it("lets you pick up to three categories and disables the rest", async () => {
    renderDialog()
    await typeTopicAndDescription()

    const group = screen.getByRole("group", { name: "Categories (1–3)" })
    for (const name of ["Software development", "Business", "Languages"]) {
      await userEvent.click(within(group).getByRole("button", { name }))
    }
    expect(within(group).getByRole("button", { name: "Leisure" })).toBeDisabled()

    // A chosen chip can still be unpressed, which frees the others again.
    await userEvent.click(within(group).getByRole("button", { name: "Business" }))
    expect(within(group).getByRole("button", { name: "Leisure" })).toBeEnabled()
    await userEvent.click(within(group).getByRole("button", { name: "Leisure" }))
    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("kvintets", {
        json: {
          title: "Topic",
          categorySlugs: ["software-development", "languages", "leisure"],
          description: "We talk together.",
        },
      }),
    )
  })

  it("asks for at least one category", async () => {
    renderDialog()
    await typeTopicAndDescription()

    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    expect(await screen.findByText("Choose a category")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("asks for a description", async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText("What do you want to talk about"), "Topic")
    await userEvent.click(screen.getByRole("button", { name: "Languages" }))
    await userEvent.type(screen.getByLabelText("Description"), "   ")

    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    expect(await screen.findByText("Describe what the kvintet is about")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("asks for at least 10 characters in the description", async () => {
    renderDialog()
    await userEvent.type(screen.getByLabelText("What do you want to talk about"), "Topic")
    await userEvent.click(screen.getByRole("button", { name: "Languages" }))
    await userEvent.type(screen.getByLabelText("Description"), "Too short")

    await userEvent.click(screen.getByRole("button", { name: "Start a kvintet" }))

    expect(
      await screen.findByText("The description must be at least 10 characters"),
    ).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("counts the description's characters, stops at 280 and turns red there", async () => {
    renderDialog()
    const description = screen.getByLabelText("Description")

    expect(screen.getByText("0 / 280")).not.toHaveClass("text-destructive")
    await userEvent.click(description)
    await userEvent.paste("a".repeat(279))
    expect(screen.getByText("279 / 280")).not.toHaveClass("text-destructive")
    expect(description).not.toHaveClass("border-destructive")

    await userEvent.paste("bcd")
    expect(description).toHaveValue(`${"a".repeat(279)}b`)
    expect(screen.getByText("280 / 280")).toHaveClass("text-destructive")
    expect(description).toHaveClass("border-destructive")
  })

  it("explains what the others will see, and shows the person starting it", () => {
    renderDialog()

    expect(
      screen.getByText("You'll be its first member. Others join by topic."),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Others will see the topic, the description and your role. Your name only once the kvintet starts. Please leave out health, religion and other sensitive details.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog").querySelector("[data-slot='avatar']")).not.toBeNull()
  })

  it("has no avatar when nobody is signed in", () => {
    renderDialog("")

    expect(screen.getByRole("dialog").querySelector("[data-slot='avatar']")).toBeNull()
  })

  describe("focus on open", () => {
    const stubPhone = (isPhone: boolean) =>
      vi.stubGlobal("matchMedia", () => ({
        matches: isPhone,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

    afterEach(() => vi.unstubAllGlobals())

    it("keeps the keyboard closed on a phone by focusing the dialog, not the topic", async () => {
      stubPhone(true)
      renderDialog()

      const dialog = await screen.findByRole("dialog")
      await waitFor(() => expect(dialog).toHaveFocus())
      expect(screen.getByLabelText("What do you want to talk about")).not.toHaveFocus()
    })

    it("focuses the topic on larger screens", async () => {
      stubPhone(false)
      renderDialog()

      await waitFor(() =>
        expect(screen.getByLabelText("What do you want to talk about")).toHaveFocus(),
      )
    })
  })
})
