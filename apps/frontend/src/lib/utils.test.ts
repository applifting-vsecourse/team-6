import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("keeps a custom font size next to a text colour", () => {
    expect(cn("text-small text-destructive")).toBe("text-small text-destructive")
  })

  it("lets a later font size win over an earlier one", () => {
    expect(cn("text-base text-small")).toBe("text-small")
    expect(cn("text-label", "text-compact")).toBe("text-compact")
  })
})
