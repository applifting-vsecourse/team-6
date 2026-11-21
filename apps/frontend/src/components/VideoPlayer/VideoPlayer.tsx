import { useEffect, useRef, useState, type ReactNode } from "react"
import { Captions, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"
import { useTheme } from "@/lib/theme"
import { useMediaQuery } from "@/lib/useMediaQuery"

/** One language of the film: a picture per theme (the colours are baked in) and its subtitles. */
export type LanguageSource = { light: string; dark: string; captions: string }
/** English is the fallback for every language that has no film of its own yet. */
export type VideoSources = { en: LanguageSource } & Partial<Record<string, LanguageSource>>

type VideoPlayerProps = {
  sources: VideoSources
  title: string
  subtitle: string
  /** The still shown until the film first plays (and all the time under reduced motion). */
  artwork: ReactNode
  className?: string
}

// m:ss, for a film that is about a minute long
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`

// Dragging the volume to 0 mutes it and leaves the volume at 0, so unmuting must raise it too.
function unmute(media: HTMLVideoElement) {
  if (media.volume === 0) media.volume = 1
  media.muted = false
}

// A track that is "hidden" still loads its cues, so switching captions back on is instant.
function showCaptions(media: HTMLVideoElement | null, isOn: boolean) {
  const track = media?.textTracks[0]
  if (track) track.mode = isOn ? "showing" : "hidden"
}

// Text on the poster sits on a dark scrim in both themes, so it is white in both.
const CHIP =
  "rounded-full bg-overlay/55 px-2.5 py-1 font-mono text-meta tracking-meta text-white uppercase"

/**
 * The product film. Starts muted when it scrolls into view (browsers only allow sound after a
 * click), never starts by itself under reduced motion, and has a visible way to turn sound on.
 * The film and its subtitles follow the current language and theme.
 */
export function VideoPlayer({ sources, title, subtitle, artwork, className }: VideoPlayerProps) {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  const language = i18n.resolvedLanguage ?? "en"
  const source = sources[language] ?? sources.en
  const captionsLanguage = sources[language] ? language : "en"

  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  // Someone who paused it does not want it back when the page scrolls.
  const userPaused = useRef(false)
  // Where to carry on after a new file replaces the current one (language or theme changed).
  const pendingResume = useRef({ time: 0, isPlaying: false })
  const src = source[theme]

  const [hasStarted, setStarted] = useState(false)
  const [isPlaying, setPlaying] = useState(false)
  const [isEnded, setEnded] = useState(false)
  const [isMuted, setMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shouldShowCaptions, setCaptionsOn] = useState(true)

  // The file is swapped by hand rather than through the `src` prop: the position and whether it was
  // playing have to be read from the element before it starts loading the new file.
  useEffect(() => {
    const media = video.current
    if (!media || media.getAttribute("src") === src) return
    pendingResume.current = { time: media.currentTime, isPlaying: !media.paused && !media.ended }
    media.src = src
  }, [src])

  useEffect(() => {
    const element = frame.current
    const media = video.current
    if (!element || !media || isReducedMotion) return
    const play = () => {
      if (!userPaused.current && !media.ended) media.play().catch(() => undefined)
    }
    if (typeof IntersectionObserver === "undefined") {
      play()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play()
        else media.pause()
      },
      { threshold: 0.5 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [isReducedMotion])

  useEffect(
    () => showCaptions(video.current, shouldShowCaptions),
    [shouldShowCaptions, source.captions],
  )

  const toggle = () => {
    const media = video.current
    if (!media) return
    if (media.paused || media.ended) {
      if (media.ended) media.currentTime = 0
      userPaused.current = false
      media.play().catch(() => undefined)
    } else {
      userPaused.current = true
      media.pause()
    }
  }

  // The big button on the poster is a click, so sound is allowed.
  const startWithSound = () => {
    const media = video.current
    if (!media) return
    unmute(media)
    userPaused.current = false
    media.play().catch(() => undefined)
  }

  const toggleMute = () => {
    const media = video.current
    if (!media) return
    if (media.muted) unmute(media)
    else media.muted = true
  }

  const setLevel = (level: number) => {
    const media = video.current
    if (!media) return
    media.volume = level
    media.muted = level === 0
  }

  const seek = (seconds: number) => {
    if (video.current) video.current.currentTime = seconds
    setTime(seconds)
  }

  return (
    <div
      ref={frame}
      role="group"
      aria-label={title}
      className={className}
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-highlight-soft md:rounded-3xl">
        <video
          ref={video}
          muted
          playsInline
          disablePictureInPicture
          preload="metadata"
          className="size-full object-cover [&::cue]:bg-overlay/70 [&::cue]:text-white"
          onPlay={() => {
            setPlaying(true)
            setEnded(false)
          }}
          onPlaying={() => setStarted(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setEnded(true)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            const media = event.currentTarget
            setDuration(media.duration)
            showCaptions(media, shouldShowCaptions)
            const { time: at, isPlaying: didPlay } = pendingResume.current
            pendingResume.current = { time: 0, isPlaying: false }
            if (at > 0) media.currentTime = at
            if (didPlay) media.play().catch(() => undefined)
          }}
          onVolumeChange={(event) => {
            setMuted(event.currentTarget.muted)
            setVolume(event.currentTarget.volume)
          }}
        >
          <track
            kind="captions"
            src={source.captions}
            srcLang={captionsLanguage}
            label={captionsLanguage.toUpperCase()}
            default
          />
        </video>

        {hasStarted ? null : (
          <div className="absolute inset-0 bg-highlight-soft">
            {artwork}
            <div className="absolute inset-0 bg-linear-to-b from-transparent from-60% to-overlay/60" />
            <Button
              size="icon-lg"
              aria-label={t("videoPlayer.play")}
              onClick={startWithSound}
              className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full md:size-22 [&_svg:not([class*='size-'])]:size-6 md:[&_svg:not([class*='size-'])]:size-9"
            >
              <Play className="fill-current" />
            </Button>
            <div className="absolute bottom-3 left-4 flex flex-col gap-1 text-white md:bottom-6 md:left-8">
              <p className="text-h3 font-semibold md:text-h2">{title}</p>
              <p className="text-small md:text-compact">{subtitle}</p>
            </div>
            <div className="absolute top-3 right-4 flex gap-2 md:top-6 md:right-6">
              {duration > 0 ? <span className={CHIP}>{clock(duration)}</span> : null}
              <span className={CHIP}>
                {Object.keys(sources)
                  .map((code) => code.toUpperCase())
                  .join(" · ")}
              </span>
            </div>
          </div>
        )}

        {hasStarted && isMuted ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className="absolute top-3 left-3 h-auto rounded-full bg-overlay/70 px-3 py-2 text-small font-normal text-white hover:bg-overlay/80 hover:text-white"
          >
            <VolumeX />
            {t("videoPlayer.soundOff")}
          </Button>
        ) : null}

        {/* On a phone the seek bar is hidden, so a hairline along the bottom edge shows the progress (as in the phone design). */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.75 bg-white/35 md:hidden"
        >
          <div
            className="h-full bg-highlight"
            style={{ width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t(
            isEnded ? "videoPlayer.replay" : isPlaying ? "videoPlayer.pause" : "videoPlayer.play",
          )}
          onClick={toggle}
        >
          {isEnded ? <RotateCcw /> : isPlaying ? <Pause /> : <Play />}
        </Button>
        <span className="w-10 shrink-0 font-mono text-small text-muted-foreground tabular-nums max-md:hidden">
          {clock(time)}
        </span>
        <span className="flex-1 md:hidden" />
        <Slider
          aria-label={t("videoPlayer.seek")}
          className="max-md:hidden"
          min={0}
          max={duration || 1}
          step={0.1}
          value={[Math.min(time, duration || 1)]}
          onValueChange={([seconds]) => seek(seconds ?? 0)}
          disabled={duration === 0}
        />
        <Toggle
          aria-label={t("videoPlayer.captions")}
          pressed={shouldShowCaptions}
          onPressedChange={setCaptionsOn}
        >
          <Captions />
        </Toggle>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t(isMuted ? "videoPlayer.unmute" : "videoPlayer.mute")}
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
        <Slider
          aria-label={t("videoPlayer.volume")}
          className="max-w-24 max-md:hidden"
          min={0}
          max={1}
          step={0.05}
          value={[isMuted ? 0 : volume]}
          onValueChange={([level]) => setLevel(level ?? 0)}
        />
      </div>
    </div>
  )
}
