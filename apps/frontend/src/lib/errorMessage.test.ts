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
    expect(getErrorMessage(httpError({ code: "too_many_requests" }))).toBe(
      "Too many requests. Please slow down and try again later.",
    )
    expect(getErrorMessage(httpError({ code: "brand_new" }), "errors.signInFailed")).toBe(
      "Sign in failed",
    )
    expect(getErrorMessage(httpError(undefined))).toBe("An unexpected error occurred.")
  })

  it("translates BetterAuth codes", () => {
    const error = toAuthError({ code: "INVALID_EMAIL_OR_PASSWORD", message: "English text" })
    expect(getErrorMessage(error, "errors.signInFailed")).toBe(
      "Email or password is wrong. Please try again.",
    )
  })

  it("never shows the server's English message", () => {
    const error = toAuthError({ code: "SOMETHING_NEW", message: "Server English text" })
    expect(getErrorMessage(error, "errors.signUpFailed")).toBe("Sign up failed")
  })

  it("translates profile and reference error codes in both English and Czech", async () => {
    expect(getErrorMessage(httpError({ code: "PROFILE_ROLE_REQUIRED" }))).toBe(
      "Pick at least one role.",
    )
    expect(getErrorMessage(httpError({ code: "PROFILE_LOCATION_REQUIRED" }))).toBe(
      "Choose a place on the map.",
    )
    expect(getErrorMessage(httpError({ code: "PROFILE_AVAILABILITY_REQUIRED" }))).toBe(
      "Pick at least one day and time of day.",
    )
    expect(getErrorMessage(httpError({ code: "CITY_NOT_FOUND" }))).toBe(
      "We couldn't find this city.",
    )
    expect(getErrorMessage(httpError({ code: "TAGS_NOT_FOUND" }))).toBe(
      "Some of the selected tags no longer exist. Please pick them again.",
    )

    await i18n.changeLanguage("cs")
    expect(getErrorMessage(httpError({ code: "PROFILE_ROLE_REQUIRED" }))).toBe(
      "Vyberte alespoň jednu roli.",
    )
    expect(getErrorMessage(httpError({ code: "PROFILE_LOCATION_REQUIRED" }))).toBe(
      "Zvolte místo na mapě.",
    )
    expect(getErrorMessage(httpError({ code: "PROFILE_AVAILABILITY_REQUIRED" }))).toBe(
      "Vyberte alespoň jeden den a denní dobu.",
    )
    expect(getErrorMessage(httpError({ code: "CITY_NOT_FOUND" }))).toBe(
      "Toto město jsme nenašli.",
    )
    expect(getErrorMessage(httpError({ code: "TAGS_NOT_FOUND" }))).toBe(
      "Některé vybrané štítky už neexistují. Vyberte je prosím znovu.",
    )
  })

  it("follows the active language", async () => {
    await i18n.changeLanguage("cs")
    expect(getErrorMessage(httpError({ code: "unauthorized" }))).toBe(
      "Nejdřív se musíte přihlásit.",
    )
  })
})
