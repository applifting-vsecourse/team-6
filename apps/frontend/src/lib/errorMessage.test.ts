import { HTTPError } from "ky"

import i18n from "@/i18n"

import { getErrorMessage, toAuthError } from "./errorMessage"

const httpError = (data: unknown) =>
  Object.assign(Object.create(HTTPError.prototype) as HTTPError, { data })

afterEach(() => i18n.changeLanguage("en"))

describe("getErrorMessage", () => {
  it("translates backend validation codes", () => {
    const error = httpError({
      code: "validation_failed",
      errors: [
        { field: "text", code: "isNotEmpty" },
        { field: "text", code: "maxLength" },
        { field: "other", code: "maxLength" },
      ],
    })
    expect(getErrorMessage(error)).toBe("Value is required, Value is too long")
  })

  it("falls back to a generic validation text for unknown constraints", () => {
    const error = httpError({ code: "validation_failed", errors: [{ field: "a", code: "weird" }] })
    expect(getErrorMessage(error)).toBe("Invalid value")
  })

  it("translates plain backend codes and uses the fallback for unknown ones", () => {
    expect(getErrorMessage(httpError({ code: "unauthorized" }))).toBe("You need to sign in first.")
    expect(getErrorMessage(httpError({ code: "brand_new" }), "errors.signInFailed")).toBe(
      "Sign in failed",
    )
    expect(getErrorMessage(httpError(undefined))).toBe("An unexpected error occurred.")
  })

  it("translates BetterAuth codes", () => {
    const error = toAuthError({ code: "INVALID_EMAIL_OR_PASSWORD", message: "English text" })
    expect(getErrorMessage(error, "errors.signInFailed")).toBe("Incorrect email or password.")
  })

  it("never shows the server's English message", () => {
    const error = toAuthError({ code: "SOMETHING_NEW", message: "Server English text" })
    expect(getErrorMessage(error, "errors.signUpFailed")).toBe("Sign up failed")
  })

  it("follows the active language", async () => {
    await i18n.changeLanguage("cs")
    expect(getErrorMessage(httpError({ code: "unauthorized" }))).toBe(
      "Nejdřív se musíte přihlásit.",
    )
  })
})
