import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AvatarSeedContext } from "@/features/profile/lib/avatarSeedContext"

import { OnboardingTitle } from "./OnboardingTitle"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("OnboardingTitle", () => {
  it("shows the title and description", () => {
    render(
      <OnboardingTitle
        title="Tell us about you"
        description="Others see your role."
      />,
    )

    expect(screen.getByRole("heading", { name: "Tell us about you" })).toBeInTheDocument()
    expect(screen.getByText("Others see your role.")).toBeInTheDocument()
  })

  it("draws the person's own blobatar only when it has a seed", () => {
    const { container, rerender } = render(
      <OnboardingTitle
        title="Title"
        description="Text"
      />,
    )
    expect(container.querySelector("svg")).toBeNull()
    // No avatar: no grid and no pinned column, so title and description start at the same edge.
    expect(screen.getByRole("heading").className).not.toContain("col-start-2")
    expect(container.firstElementChild?.className).not.toContain("grid")

    rerender(
      <AvatarSeedContext.Provider value="jana">
        <OnboardingTitle
          title="Title"
          description="Text"
        />
      </AvatarSeedContext.Provider>,
    )
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
