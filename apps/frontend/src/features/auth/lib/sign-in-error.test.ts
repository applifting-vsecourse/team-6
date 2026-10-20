import { describe, expect, it } from "vitest"

import { signInErrorMessage } from "@/features/auth/lib/sign-in-error"

describe("signInErrorMessage", () => {
  it("blames the credentials only for the invalid-credentials code", () => {
    expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Přihlášení se nezdařilo. Nesprávný e-mail nebo heslo.",
    )
  })

  it("does not blame the credentials for network or server errors", () => {
    const generic = "Přihlášení se nezdařilo. Zkuste to prosím znovu."
    expect(
      signInErrorMessage(Object.assign(new Error("Failed to fetch"), { code: undefined })),
    ).toBe(generic)
    expect(signInErrorMessage({ code: "INTERNAL_SERVER_ERROR" })).toBe(generic)
    expect(signInErrorMessage(null)).toBe(generic)
  })
})
