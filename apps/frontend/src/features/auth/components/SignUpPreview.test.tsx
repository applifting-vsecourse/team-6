import { render } from "@testing-library/react"

import { SignUpPreview } from "./SignUpPreview"

// The gaze driver needs browser APIs jsdom lacks (matchMedia, ResizeObserver).
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const avatarMarkup = (username: string, variant: "panel" | "inline" = "panel") => {
  const { container } = render(
    <SignUpPreview
      username={username}
      variant={variant}
    />,
  )
  return container.querySelector("[data-slot=avatar]")?.innerHTML
}

describe("SignUpPreview", () => {
  it("draws a face from the username and changes it with the username", () => {
    expect(avatarMarkup("jana")).toBeTruthy()
    expect(avatarMarkup("jana")).not.toBe(avatarMarkup("petr"))
  })

  it("is seeded like the stored username: trimmed and lowercase", () => {
    expect(avatarMarkup("  Jana ")).toBe(avatarMarkup("jana"))
  })

  it("shows a neutral placeholder while the username is empty", () => {
    const placeholder = avatarMarkup("   ")

    expect(placeholder).toBeTruthy()
    expect(placeholder).not.toBe(avatarMarkup("jana"))
  })

  it("renders the small inline variant too", () => {
    expect(avatarMarkup("jana", "inline")).toBeTruthy()
  })
})
