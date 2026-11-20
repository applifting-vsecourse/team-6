import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { VideoPlayer, type VideoSources } from "@/components/VideoPlayer/VideoPlayer"
import i18n from "@/i18n"
import { setTheme } from "@/lib/theme"

const sources: VideoSources = {
  en: { light: "/en-light.mp4", dark: "/en-dark.mp4", captions: "/en.vtt" },
  cs: { light: "/cs-light.mp4", dark: "/cs-dark.mp4", captions: "/cs.vtt" },
}

function renderPlayer(films: VideoSources = sources) {
  const view = render(
    <VideoPlayer
      sources={films}
      title="Kvintet in one minute"
      subtitle="Your story"
      artwork={<span>artwork</span>}
    />,
  )
  return { ...view, film: view.container.querySelector("video")! }
}

// jsdom has no matchMedia; each test says which queries match.
function stubMedia(matching: string[]) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: matching.some((m) => query.includes(m)),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  )
}

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  setTheme("light")
  await i18n.changeLanguage("en")
})

describe("VideoPlayer", () => {
  it("is muted and inline, and starts by itself when nothing says otherwise", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play")
    const { film } = renderPlayer()

    expect(film.muted).toBe(true)
    expect(film).toHaveAttribute("playsinline")
    expect(play).toHaveBeenCalled()
  })

  it("does not start by itself under reduced motion, and the big button then plays with sound", () => {
    stubMedia(["reduced-motion"])
    const play = vi.spyOn(HTMLMediaElement.prototype, "play")
    const { film } = renderPlayer()

    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole("button", { name: "Play" })[0]!)

    expect(play).toHaveBeenCalled()
    expect(film.muted).toBe(false)
  })

  it("starts when it scrolls into view and pauses when it leaves", () => {
    let notify: (entries: Partial<IntersectionObserverEntry>[]) => void = () => undefined
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback
        }
        observe = vi.fn()
        disconnect = vi.fn()
      },
    )
    const play = vi.spyOn(HTMLMediaElement.prototype, "play")
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause")
    renderPlayer()
    expect(play).not.toHaveBeenCalled()

    act(() => notify([{ isIntersecting: true }]))
    expect(play).toHaveBeenCalledTimes(1)

    act(() => notify([{ isIntersecting: false }]))
    expect(pause).toHaveBeenCalled()
  })

  it("shows the poster until the film plays", () => {
    const { film } = renderPlayer()
    expect(screen.getByText("artwork")).toBeInTheDocument()
    expect(screen.getByText("Your story")).toBeInTheDocument()

    fireEvent.playing(film)

    expect(screen.queryByText("artwork")).not.toBeInTheDocument()
  })

  it("keeps a visible way to turn the sound on while it is muted", () => {
    const { film } = renderPlayer()
    fireEvent.playing(film)

    fireEvent.click(screen.getByRole("button", { name: "Turn on sound" }))
    expect(film.muted).toBe(false)

    fireEvent.volumeChange(film)
    expect(screen.queryByRole("button", { name: "Turn on sound" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument()
  })

  it("switches between play, pause and replay", () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause")
    const { film } = renderPlayer()
    Object.defineProperty(film, "paused", { configurable: true, value: false }) // jsdom never plays
    fireEvent.play(film)

    fireEvent.click(screen.getByRole("button", { name: "Pause" }))
    expect(pause).toHaveBeenCalled()

    fireEvent.pause(film)
    fireEvent.ended(film)
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument()
  })

  it("has subtitles that can be switched off", () => {
    const { film } = renderPlayer()
    const captions = screen.getByRole("button", { name: "Captions" })

    expect(film.querySelector("track[kind='captions'][default]")).toHaveAttribute("src", "/en.vtt")
    expect(captions).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(captions)
    expect(captions).toHaveAttribute("aria-pressed", "false")
  })

  it("follows the language and the theme", async () => {
    const { film } = renderPlayer()
    expect(film).toHaveAttribute("src", "/en-light.mp4")

    act(() => setTheme("dark"))
    expect(film).toHaveAttribute("src", "/en-dark.mp4")

    await act(() => i18n.changeLanguage("cs"))
    expect(film).toHaveAttribute("src", "/cs-dark.mp4")
    expect(film.querySelector("track")).toHaveAttribute("src", "/cs.vtt")
    expect(film.querySelector("track")).toHaveAttribute("srclang", "cs")
  })

  it("shows English where a language has no film yet", async () => {
    await i18n.changeLanguage("cs")
    const { film } = renderPlayer({ en: sources.en })

    expect(film).toHaveAttribute("src", "/en-light.mp4")
    expect(film.querySelector("track")).toHaveAttribute("srclang", "en")
  })

  it("carries on from the same second when the file is swapped", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play")
    const { film } = renderPlayer()
    Object.defineProperty(film, "currentTime", { writable: true, value: 12 })
    fireEvent.play(film)
    fireEvent.timeUpdate(film)

    act(() => setTheme("dark"))
    film.currentTime = 0 // a new file starts from the top
    play.mockClear()
    fireEvent.loadedMetadata(film)

    expect(film.currentTime).toBe(12)
    expect(play).toHaveBeenCalled()
  })
})
