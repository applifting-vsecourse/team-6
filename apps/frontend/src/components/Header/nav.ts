import { ROUTES } from "@/app/routes"

// Only routes that exist. Návrhy and Můj kvintet join when their stories add the pages.
export const NAV_ITEMS = [{ to: ROUTES.overview, label: "Přehled" }] as const
