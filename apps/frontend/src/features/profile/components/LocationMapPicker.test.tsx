import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LocationMapPicker } from "./LocationMapPicker"

describe("LocationMapPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders map container and allows changing radius via preset buttons", async () => {
    const onChange = vi.fn()
    render(
      <LocationMapPicker
        latitude={50.0}
        longitude={15.0}
        radiusKm={25}
        onChange={onChange}
      />,
    )

    expect(screen.getByTestId("location-map-container")).toBeInTheDocument()
    expect(screen.getByText("25 km radius")).toBeInTheDocument()

    // Click 50 km preset button
    const preset50Btn = screen.getByRole("button", { name: "Up to 50 km" })
    await userEvent.click(preset50Btn)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 50,
        longitude: 15,
        radiusKm: 50,
      }),
    )
    expect(screen.getByText("50 km radius")).toBeInTheDocument()
  })

  it("attempts auto-location when latitude and longitude are null", () => {
    const onChange = vi.fn()
    const mockPosition = {
      coords: {
        latitude: 50.087,
        longitude: 14.421,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => ({}),
    } as unknown as GeolocationPosition

    const mockGetCurrentPosition = vi
      .fn()
      .mockImplementation((success: (pos: GeolocationPosition) => void) => {
        success(mockPosition)
      })

    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      writable: true,
      configurable: true,
    })

    render(
      <LocationMapPicker
        latitude={null}
        longitude={null}
        radiusKm={25}
        onChange={onChange}
      />,
    )

    expect(mockGetCurrentPosition).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 50.087,
        longitude: 14.421,
        radiusKm: 25,
      }),
    )
  })

  it("triggers manual geolocation when clicking 'Use my location' button", async () => {
    const onChange = vi.fn()
    const mockPosition = {
      coords: {
        latitude: 49.195,
        longitude: 16.608,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => ({}),
    } as unknown as GeolocationPosition

    const mockGetCurrentPosition = vi
      .fn()
      .mockImplementation((success: (pos: GeolocationPosition) => void) => {
        success(mockPosition)
      })

    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      writable: true,
      configurable: true,
    })

    render(
      <LocationMapPicker
        latitude={50.0}
        longitude={15.0}
        radiusKm={50}
        onChange={onChange}
      />,
    )

    const locateBtn = screen.getByRole("button", { name: /Use my location/i })
    await userEvent.click(locateBtn)

    expect(mockGetCurrentPosition).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 49.195,
        longitude: 16.608,
        radiusKm: 50,
      }),
    )
  })
})
