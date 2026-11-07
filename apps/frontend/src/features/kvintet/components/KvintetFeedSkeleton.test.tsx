import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { KvintetFeedSkeleton } from "./KvintetFeedSkeleton"

describe("KvintetFeedSkeleton", () => {
  it("shows three cards of five seats and says what it is waiting for", () => {
    const { container } = render(<KvintetFeedSkeleton />)

    expect(screen.getByRole("status")).toHaveTextContent("Looking for kvintets that suit you…")
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(15)
  })
})
