import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Step2Availability } from "./Step2Availability"

vi.mock("@/features/profile/components/LocationMapPicker", () => ({
  DEFAULT_RADIUS_KM: 25,
  LocationMapPicker: ({
    onChange,
  }: {
    onChange: (loc: { latitude: number; longitude: number; radiusKm: number }) => void
  }) => (
    <button
      type="button"
      onClick={() => onChange({ latitude: 50.07, longitude: 14.43, radiusKm: 10 })}
    >
      Pick on map
    </button>
  ),
}))

describe("Step2Availability", () => {
  it("allows selecting availability options and continuing", async () => {
    const onContinue = vi.fn()
    const onBack = vi.fn()

    render(
      <Step2Availability
        initialData={{
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
          radiusKm: 10,
          latitude: 50.07,
          longitude: 14.43,
        }}
        onBack={onBack}
        onContinue={onContinue}
      />,
    )

    await userEvent.click(screen.getByLabelText("Weekdays"))
    await userEvent.click(screen.getByLabelText("Evenings"))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onContinue).toHaveBeenCalledWith({
      weekdays: true,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: true,
      radiusKm: 10,
      latitude: 50.07,
      longitude: 14.43,
    })
  })

  it("calls onBack when back button is clicked", async () => {
    const onBack = vi.fn()
    render(
      <Step2Availability
        initialData={{
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
          radiusKm: 10,
          latitude: 50.07,
          longitude: 14.43,
        }}
        onBack={onBack}
        onContinue={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(onBack).toHaveBeenCalled()
  })

  it("requires day and time-of-day options and scrolls into view on error", async () => {
    const onContinue = vi.fn()
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    render(
      <Step2Availability
        initialData={{
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
          radiusKm: 25,
        }}
        onBack={vi.fn()}
        onContinue={onContinue}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(
      screen.getByText("Please select at least one day option (weekdays or weekends)."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Please select at least one time of day (morning, afternoon, or evening)."),
    ).toBeInTheDocument()
    expect(scrollIntoViewMock).toHaveBeenCalled()

    // Select day -> day error disappears
    await userEvent.click(screen.getByLabelText("Weekdays"))
    expect(
      screen.queryByText("Please select at least one day option (weekdays or weekends)."),
    ).not.toBeInTheDocument()

    // Still missing time of day
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onContinue).not.toHaveBeenCalled()

    // Select time of day -> time error disappears
    await userEvent.click(screen.getByLabelText("Mornings"))
    expect(
      screen.queryByText(
        "Please select at least one time of day (morning, afternoon, or evening).",
      ),
    ).not.toBeInTheDocument()

    // Still missing location
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText("Please select a location on the map.")).toBeInTheDocument()

    // Pick a point on the map -> location error disappears and form can continue
    await userEvent.click(screen.getByRole("button", { name: "Pick on map" }))
    expect(screen.queryByText("Please select a location on the map.")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        weekdays: true,
        weekends: false,
        mornings: true,
        afternoons: false,
        evenings: false,
        radiusKm: 10,
        latitude: 50.07,
        longitude: 14.43,
      }),
    )
  })
})
