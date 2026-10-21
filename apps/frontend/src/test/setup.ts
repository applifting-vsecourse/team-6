import "@testing-library/jest-dom/vitest"

import i18n from "@/i18n"

if (typeof window !== "undefined") {
  window.ResizeObserver =
    window.ResizeObserver ??
    class ResizeObserver {
      observe(): void {
        // no-op for tests
      }
      unobserve(): void {
        // no-op for tests
      }
      disconnect(): void {
        // no-op for tests
      }
    }
}

if (typeof Element !== "undefined") {
  Object.defineProperty(Element.prototype, "hasPointerCapture", {
    value: () => false,
    writable: true,
  })
  Object.defineProperty(Element.prototype, "setPointerCapture", {
    value: () => {
      /* test mock */
    },
    writable: true,
  })
  Object.defineProperty(Element.prototype, "releasePointerCapture", {
    value: () => {
      /* test mock */
    },
    writable: true,
  })
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    value: () => {
      /* test mock */
    },
    writable: true,
  })
}

// Tests assert on English text regardless of the machine's locale.
await i18n.changeLanguage("en")
