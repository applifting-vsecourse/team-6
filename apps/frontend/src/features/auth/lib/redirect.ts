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

// shortcut: onboarding doesn't exist yet, so everyone counts as onboarded; replace with the profile check in the onboarding story.
export const isOnboarded = () => true

// `from` comes from the URL. The URL parser resolves "//host", "/\host" and "/<tab>/host" to another origin like a browser does.
const isSameOriginPath = (target: string) =>
  target.startsWith("/") && new URL(target, "http://app.invalid").origin === "http://app.invalid"

// Where to go after signing in: onboarding first, then the page the user was sent away from, else Overview.
export const postSignInPath = (from?: string, hasOnboarded = isOnboarded()) => {
  if (!hasOnboarded) return ROUTES.onboarding
  const target = from ? decodeRedirectUri(from) : undefined
  return target && isSameOriginPath(target) ? target : ROUTES.overview
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
