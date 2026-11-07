import { useSyncExternalStore } from "react"

// jsdom has no matchMedia, so a test sees "no match" unless it stubs one.
const mediaQuery = (query: string) =>
  typeof window.matchMedia === "function" ? window.matchMedia(query) : null

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = mediaQuery(query)
      list?.addEventListener("change", notify)
      return () => list?.removeEventListener("change", notify)
    },
    () => mediaQuery(query)?.matches ?? false,
    () => false,
  )
}
