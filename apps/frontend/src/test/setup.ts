import "@testing-library/jest-dom/vitest"

import i18n from "@/i18n"

// jsdom has no ResizeObserver; Radix form controls (checkbox) need one to mount.
globalThis.ResizeObserver ??= class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Tests assert on English text regardless of the machine's locale.
await i18n.changeLanguage("en")
