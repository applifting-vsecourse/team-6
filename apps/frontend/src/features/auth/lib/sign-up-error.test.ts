import { describe, expect, it } from "vitest"

import { signUpErrorMessage } from "@/features/auth/lib/sign-up-error"

describe("signUpErrorMessage", () => {
  it("translates known BetterAuth codes", () => {
    expect(signUpErrorMessage({ code: "USER_ALREADY_EXISTS" })).toBe(
      "Účet s tímto e-mailem už existuje.",
    )
  })

  it("falls back to a generic Czech message and never echoes server wording", () => {
    expect(signUpErrorMessage(Object.assign(new Error("Boom"), { code: "SOMETHING_NEW" }))).toBe(
      "Registrace se nezdařila.",
    )
    expect(signUpErrorMessage(null)).toBe("Registrace se nezdařila.")
  })
})
