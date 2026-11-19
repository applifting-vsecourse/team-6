import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { OnboardingFrame } from "./OnboardingFrame"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const frame = (
  props: Partial<Omit<React.ComponentProps<typeof OnboardingFrame>, "children">> = {},
  answers: React.ReactNode = <p>answers</p>,
) => (
  <OnboardingFrame
    page="teach"
    seed="jana"
    title="What could you teach the others?"
    hint="Pick as many topics as you like."
    onContinue={vi.fn()}
    continueLabel="Continue"
    {...props}
  >
    {answers}
  </OnboardingFrame>
)

describe("OnboardingFrame", () => {
  it("puts the question in the bubble, the hint under it, and the answers below", () => {
    render(frame())

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "What could you teach the others?",
    )
    expect(screen.getByText("Pick as many topics as you like.")).toHaveClass(
      "text-muted-foreground",
    )
    expect(screen.getByText("answers")).toBeInTheDocument()
    expect(screen.getByText("You can change it any time in your profile.")).toBeInTheDocument()
  })

  it("shows the progress of its page", () => {
    render(frame())

    expect(screen.getByText("2 / 4")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Your profile" })).toBeInTheDocument()
  })

  it("has Back only when there is a page to go back to", async () => {
    const onBack = vi.fn()
    const { rerender } = render(frame())
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()

    rerender(frame({ onBack }))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))

    expect(onBack).toHaveBeenCalledOnce()
  })

  it("continues with the button and with Enter, as a form does", async () => {
    const onContinue = vi.fn()
    render(frame({ onContinue }, <input aria-label="field" />))

    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    await userEvent.type(screen.getByRole("textbox", { name: "field" }), "{Enter}")

    expect(onContinue).toHaveBeenCalledTimes(2)
  })

  it("turns the hint red and says it again next to Continue when an answer is missing", () => {
    render(
      frame({
        error: { hint: "This one we need.", problem: "Pick one." },
      }),
    )

    expect(screen.getByText("This one we need.")).toHaveClass("text-destructive")
    expect(screen.queryByText("Pick as many topics as you like.")).not.toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Pick one.")
    expect(
      screen.queryByText("You can change it any time in your profile."),
    ).not.toBeInTheDocument()
  })

  it("shows a failed save next to Continue", () => {
    render(frame({ saveError: "An unexpected error occurred." }))

    expect(screen.getByRole("alert")).toHaveTextContent("An unexpected error occurred.")
  })

  it("cannot be continued twice while it saves", () => {
    render(frame({ isSaving: true }))

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled()
  })
})
