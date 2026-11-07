import type { ParsedLocation } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

export const encodeRedirectUri = (location: ParsedLocation) => encodeURIComponent(location.href)

export const decodeRedirectUri = (encoded: string) => {
  try {
    return decodeURIComponent(encoded)
  } catch {
    return "/"
  }
}

export const isOnboarded = (profile?: { onboardingCompletedAt?: string | Date | null } | null) =>
  profile === undefined ? true : Boolean(profile?.onboardingCompletedAt)

// `from` comes from the URL. The URL parser resolves "//host", "/\host" and "/<tab>/host" to another origin like a browser does.
const isSameOriginPath = (target: string) =>
  target.startsWith("/") && new URL(target, "http://app.invalid").origin === "http://app.invalid"

// Where to go after signing in: Overview by default (which handles all user states including incomplete profile),
// or the page the user was sent away from (sending to onboarding only when a deep-linked page requires it).
export const postSignInPath = (from?: string, hasOnboarded = isOnboarded()) => {
  const target = from ? decodeRedirectUri(from) : undefined
  if (target && isSameOriginPath(target)) {
    const targetUrl = new URL(target, "http://app.invalid")
    if (
      !hasOnboarded &&
      targetUrl.pathname !== ROUTES.overview &&
      targetUrl.pathname !== ROUTES.onboarding
    ) {
      return ROUTES.onboarding
    }
    return target
  }
  return ROUTES.overview
}

// The router's `to` takes a pathname only, so a target like "/profile?tab=2" is split into `to`, `search` and `hash`.
// shortcut: repeated query keys collapse to the last value; upgrade if a redirect target ever needs arrays.
export const postSignInLocation = (from?: string, hasOnboarded = isOnboarded()) => {
  const url = new URL(postSignInPath(from, hasOnboarded), "http://app.invalid")
  return {
    to: url.pathname,
    search: Object.fromEntries(url.searchParams),
    hash: url.hash.slice(1) || undefined,
  }
}
