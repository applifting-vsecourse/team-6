import { describe, expect, it } from "vitest"

import captions from "@/assets/video/captions.en.vtt?raw"

const FILM_SECONDS = 63.75

const seconds = (stamp: string) => {
  const [h, m, s] = stamp.split(":").map(Number)
  return h! * 3600 + m! * 60 + s!
}

// "00:00:05.200 --> 00:00:07.618" followed by the cue text
const cues = [
  ...captions.matchAll(/^(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})\n(.+)$/gm),
].map(([, start, end, text]) => ({ start: seconds(start!), end: seconds(end!), text: text! }))

describe("English captions", () => {
  it("is a WebVTT file with cues", () => {
    expect(captions.startsWith("WEBVTT\n")).toBe(true)
    expect(cues.length).toBeGreaterThan(0)
  })

  it("has cues that run forwards, never overlap and end inside the film", () => {
    cues.forEach((cue, i) => {
      expect(cue.end).toBeGreaterThan(cue.start)
      if (i > 0) expect(cue.start).toBeGreaterThanOrEqual(cues[i - 1]!.end)
    })
    expect(cues.at(-1)!.end).toBeLessThanOrEqual(FILM_SECONDS)
  })

  it("writes product names with a capital", () => {
    expect(captions).not.toMatch(/\bexcel\b/)
  })
})
