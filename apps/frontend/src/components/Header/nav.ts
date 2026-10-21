import { ROUTES } from "@/app/routes"

// Only routes that exist. Proposals and My kvintet join when their stories add the pages.
export const NAV_ITEMS = [{ to: ROUTES.overview, labelKey: "nav.overview" }] as const
