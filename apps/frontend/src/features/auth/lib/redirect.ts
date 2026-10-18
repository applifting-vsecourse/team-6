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

// Where to go after signing in: onboarding first, then the page the user was sent away from, else Overview.
export const postSignInPath = (from?: string, hasOnboarded = isOnboarded()) => {
  if (!hasOnboarded) return ROUTES.onboarding
  const target = from ? decodeRedirectUri(from) : undefined
  // Only same-origin paths: `from` comes from the URL, so "//evil.com" or "https://…" must not pass.
  return target?.startsWith("/") && !target.startsWith("//") ? target : ROUTES.overview
}
