import { ROUTES } from "@/app/routes"

// Only routes that exist. Návrhy and Můj kvintet join when their stories add the pages.
export const NAV_ITEMS = [
  { to: ROUTES.overview, labelKey: "nav.overview" },
  { to: ROUTES.codeOfConduct, labelKey: "nav.codeOfConduct" },
] as const
