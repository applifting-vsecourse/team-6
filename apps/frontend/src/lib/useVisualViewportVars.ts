import { useEffect } from "react"

// Several dialogs can be mounted at once; the variables go away only with the last one.
let activeUsers = 0

function update(viewport: VisualViewport) {
  const root = document.documentElement.style
  // Pinch-zoom shrinks the visual viewport too, but that is not a keyboard: ignore it.
  const isZoomed = viewport.scale !== 1
  const height = isZoomed ? window.innerHeight : viewport.height
  root.setProperty("--vv-height", `${height}px`)
  root.setProperty(
    "--keyboard-inset",
    `${isZoomed ? 0 : Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
  )
}

/**
 * Mirrors the visual viewport into CSS variables while mounted. Mobile browsers keep the layout
 * viewport full height when the keyboard opens, so `fixed` sheets would sit behind it.
 * `--vv-height`: visible height; `--keyboard-inset`: space covered by the keyboard.
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleChange = () => update(viewport)
    activeUsers += 1
    handleChange()
    viewport.addEventListener("resize", handleChange)
    viewport.addEventListener("scroll", handleChange)
    return () => {
      viewport.removeEventListener("resize", handleChange)
      viewport.removeEventListener("scroll", handleChange)
      activeUsers -= 1
      if (activeUsers === 0) {
        document.documentElement.style.removeProperty("--vv-height")
        document.documentElement.style.removeProperty("--keyboard-inset")
      }
    }
  }, [])
}
