import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RadioGroup } from "@/components/ui/radio-group"

import { ChoiceTile } from "./ChoiceTile"

describe("ChoiceTile", () => {
  it("is a checkbox: the whole row ticks it, and it reports the new state", async () => {
    const onCheckedChange = vi.fn()
    render(
      <ChoiceTile
        kind="check"
        label="Weekdays"
        isChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    await userEvent.click(screen.getByText("Weekdays"))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("shows what is chosen with the accent fill, which only the row's state decides", () => {
    render(
      <ChoiceTile
        kind="check"
        label="Weekdays"
        isChecked
        onCheckedChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("checkbox", { name: "Weekdays" })).toBeChecked()
    expect(screen.getByText("Weekdays").closest("label")).toHaveClass(
      "has-[[data-state=checked]]:bg-highlight-soft",
    )
  })

  it("is a radio inside a group: one is chosen at a time", async () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup onValueChange={onValueChange}>
        <ChoiceTile
          kind="radio"
          label="Every week"
          value="WEEKLY"
        />
        <ChoiceTile
          kind="radio"
          label="Once a month"
          value="MONTHLY"
        />
      </RadioGroup>,
    )

    await userEvent.click(screen.getByText("Once a month"))

    expect(onValueChange).toHaveBeenCalledWith("MONTHLY")
    expect(screen.getByRole("radio", { name: "Once a month" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Every week" })).not.toBeChecked()
  })
})
