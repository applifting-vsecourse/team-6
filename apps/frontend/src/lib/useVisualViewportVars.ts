import { useEffect } from "react"

/**
 * Mirrors the visual viewport into CSS variables while mounted. Mobile browsers keep the layout
 * viewport full height when the keyboard opens, so `fixed` sheets would sit behind it.
 * `--vv-height`: visible height; `--keyboard-inset`: space covered by the keyboard.
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement.style

    const update = () => {
      root.setProperty("--vv-height", `${viewport.height}px`)
      root.setProperty(
        "--keyboard-inset",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      )
    }

    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      root.removeProperty("--vv-height")
      root.removeProperty("--keyboard-inset")
    }
  }, [])
}
