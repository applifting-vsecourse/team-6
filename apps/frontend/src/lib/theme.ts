import { useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"
// Same values as the `background` token in each theme; tints the mobile browser chrome.
const THEME_COLOR: Record<Theme, string> = { light: "#fbf8f2", dark: "#141f36" }

const listeners = new Set<() => void>()

// The <html> class is the source of truth: the inline script in index.html sets it
// before first paint (stored choice, else the OS preference).
function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme])
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked (private window): the theme still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as const)
  return { theme, setTheme }
}
