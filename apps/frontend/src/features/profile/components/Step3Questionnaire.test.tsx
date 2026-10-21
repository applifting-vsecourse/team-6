import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Step3Questionnaire } from "./Step3Questionnaire"

describe("Step3Questionnaire", () => {
  it("requires meeting frequency before submitting", async () => {
    const onFinish = vi.fn()
    render(
      <Step3Questionnaire
        initialData={{
          expectations: [],
          meetingFrequency: undefined,
          note: "",
        }}
        onBack={vi.fn()}
        onFinish={onFinish}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Finish" }))
    expect(onFinish).not.toHaveBeenCalled()
    expect(screen.getByText("Select how often you want to meet")).toBeInTheDocument()
  })

  it("allows selecting expectations, frequency, and entering note", async () => {
    const onFinish = vi.fn()
    const onBack = vi.fn()

    render(
      <Step3Questionnaire
        initialData={{
          expectations: [],
          meetingFrequency: undefined,
          note: "",
        }}
        onBack={onBack}
        onFinish={onFinish}
      />,
    )

    await userEvent.click(screen.getByLabelText("Learn something new"))
    await userEvent.click(screen.getByLabelText("Every week"))
    await userEvent.type(
      screen.getByPlaceholderText("e.g. I prefer to meet in English."),
      "Prefer English",
    )
    await userEvent.click(screen.getByRole("button", { name: "Finish" }))

    expect(onFinish).toHaveBeenCalledWith({
      expectations: ["learn_new"],
      meetingFrequency: "WEEKLY",
      note: "Prefer English",
    })
  })

  it("calls onBack when back button is clicked", async () => {
    const onBack = vi.fn()
    render(
      <Step3Questionnaire
        initialData={{
          expectations: [],
          meetingFrequency: "BIWEEKLY",
          note: "",
        }}
        onBack={onBack}
        onFinish={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(onBack).toHaveBeenCalled()
  })
})
