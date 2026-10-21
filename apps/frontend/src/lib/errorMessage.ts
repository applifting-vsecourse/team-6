import { HTTPError } from "ky"

import i18n from "@/i18n"

type ApiErrorBody = { code?: string; errors?: { field: string; code: string }[] }
type FallbackKey = "errors.unexpected" | "errors.signInFailed" | "errors.signUpFailed"

// Keys built from server codes are dynamic, so they can't go through the typed `t`.
const translateIfKnown = (key: string) =>
  i18n.exists(key) ? (i18n.t as (key: string) => string)(key) : undefined

// BetterAuth reports `{ message, code }` objects; keep the code on a real Error.
export const toAuthError = (error: { message?: string; code?: string }) =>
  Object.assign(new Error(error.message ?? "Auth request failed"), { code: error.code })

// Turns anything thrown by the API client or auth client into translated UI text.
// Never shows the server's own message, which is English.
// shortcut: validation reasons are listed without field names, upgrade when forms map errors to fields.
export function getErrorMessage(error: unknown, fallback: FallbackKey = "errors.unexpected") {
  if (error instanceof HTTPError) {
    const body = error.data as ApiErrorBody | undefined
    if (body?.errors?.length) {
      const reasons = body.errors.map(
        (e) => translateIfKnown(`validation.${e.code}`) ?? i18n.t("validation.invalid"),
      )
      return [...new Set(reasons)].join(", ")
    }
    const translated = body?.code ? translateIfKnown(`errors.${body.code}`) : undefined
    return translated ?? i18n.t(fallback)
  }

  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === "string") {
    return translateIfKnown(`errors.auth.${code}`) ?? i18n.t(fallback)
  }
  return i18n.t(fallback)
}
