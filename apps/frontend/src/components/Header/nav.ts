import { ROUTES } from "@/app/routes"

// Only routes that exist. The kvintet itself lives on Home.
export const NAV_ITEMS = [
  { to: ROUTES.overview, labelKey: "nav.overview" },
  { to: ROUTES.kvintetFeed, labelKey: "nav.kvintetFeed" },
] as const

/** Nav items that are shown but cannot be used, mapped to the reason shown in a tooltip. */
export type NavDisabled = Partial<Record<(typeof NAV_ITEMS)[number]["to"], string>>
