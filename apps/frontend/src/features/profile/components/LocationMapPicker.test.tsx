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
    expect(screen.getByRole("button", { name: "Up to 25 km" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )

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
    expect(screen.getByRole("button", { name: "Up to 50 km" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Up to 25 km" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("offers the four presets of the design and keeps the slider for longer radii", () => {
    render(
      <LocationMapPicker
        latitude={50}
        longitude={15}
        radiusKm={25}
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getAllByRole("button", { name: /^Up to \d+ km$/ }).map((b) => b.textContent),
    ).toEqual(["Up to 5 km", "Up to 10 km", "Up to 25 km", "Up to 50 km"])
    expect(screen.getByRole("slider", { name: "Search radius" })).toBeInTheDocument()
  })

  it("names a radius that no preset has, so it is not lost", () => {
    render(
      <LocationMapPicker
        latitude={50}
        longitude={15}
        radiusKm={100}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Up to 100 km")).toBeInTheDocument()
    for (const preset of screen.getAllByRole("button", { name: /^Up to \d+ km$/ })) {
      expect(preset).toHaveAttribute("aria-pressed", "false")
    }
  })

  it("does not automatically request geolocation on mount when latitude and longitude are null", () => {
    const onChange = vi.fn()
    const mockGetCurrentPosition = vi.fn()

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

    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
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
        latitude: 49.2,
        longitude: 16.61,
        radiusKm: 50,
      }),
    )
  })

  describe("pin visibility", () => {
    const mockGeolocation = () => {
      Object.defineProperty(globalThis.navigator, "geolocation", {
        value: {
          getCurrentPosition: (success: (pos: GeolocationPosition) => void) =>
            success({
              coords: { latitude: 49.195, longitude: 16.608 },
            } as GeolocationPosition),
        },
        writable: true,
        configurable: true,
      })
    }

    it("shows no pin, circle or coordinates before a location is picked", async () => {
      const onChange = vi.fn()
      render(
        <LocationMapPicker
          latitude={null}
          longitude={null}
          radiusKm={25}
          onChange={onChange}
        />,
      )

      const map = screen.getByTestId("location-map-container")
      expect(map.querySelector(".kvinted-map-pin")).toBeNull()
      expect(map.querySelector("path.leaflet-interactive")).toBeNull()
      expect(screen.queryByText(/50\.00/)).not.toBeInTheDocument()

      // Changing the radius must not report the default point as a selection
      await userEvent.click(screen.getByRole("button", { name: "Up to 50 km" }))
      expect(onChange).not.toHaveBeenCalled()
      expect(map.querySelector(".kvinted-map-pin")).toBeNull()
    })

    it("shows the pin and coordinates when a location is given", () => {
      render(
        <LocationMapPicker
          latitude={50.07}
          longitude={14.43}
          radiusKm={25}
          onChange={vi.fn()}
        />,
      )

      expect(
        screen.getByTestId("location-map-container").querySelector(".kvinted-map-pin"),
      ).not.toBeNull()
      expect(screen.getByText(/50\.07/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Up to 25 km" })).toHaveAttribute(
        "aria-pressed",
        "true",
      )
    })

    it("shows the pin after 'Use my location' picks a place", async () => {
      mockGeolocation()
      const onChange = vi.fn()
      render(
        <LocationMapPicker
          latitude={null}
          longitude={null}
          radiusKm={25}
          onChange={onChange}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: /Use my location/i }))

      expect(
        screen.getByTestId("location-map-container").querySelector(".kvinted-map-pin"),
      ).not.toBeNull()
      expect(screen.getByText(/49\.20/)).toBeInTheDocument()
      expect(onChange).toHaveBeenCalledWith({ latitude: 49.2, longitude: 16.61, radiusKm: 25 })
    })
  })
})
