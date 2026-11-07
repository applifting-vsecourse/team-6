import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AppLoadingScreen } from "@/components/AppLoadingScreen"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("AppLoadingScreen", () => {
  it("announces that the app is loading", () => {
    render(<AppLoadingScreen />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
    expect(screen.getByRole("main")).toBeInTheDocument()
  })
})
