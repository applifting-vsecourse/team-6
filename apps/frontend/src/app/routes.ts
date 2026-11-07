export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  codeOfConduct: "/code-of-conduct",
  overview: "/overview",
  kvintetFeed: "/kvintet/feed",
  myKvintet: "/kvintet",
  kvintetMessages: "/kvintet/messages",
  kvintetBegins: "/kvintet/begins",
  onboarding: "/onboarding",
} as const

// The landing page section that explains the product. shortcut: the footer and the menu
// link to this anchor because there is no dedicated "How Kvintet works" page yet; build the
// page when its story exists and point both links at it.
export const HOW_IT_WORKS_ANCHOR = "how-it-works"
