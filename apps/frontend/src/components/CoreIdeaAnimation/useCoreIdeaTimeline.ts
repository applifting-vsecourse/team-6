import { useEffect, useState } from "react"

/**
 * The script of the landing animation: a set of state classes on the stage plus the seat count.
 * CSS does all the moving; this only says which scene is on and when. Times are in ms from the
 * start of a loop, as measured on the phone stage; the desktop stage waits 600 ms longer for the
 * pointer to travel to the Join button.
 */
type Draft = { flags: Set<string>; count: number }
type Beat = readonly [at: number, apply: (draft: Draft) => void]

const SCENES = [
  "n0",
  "n1",
  "n2",
  "n3",
  "n4",
  "n5",
  "tray-alone",
  "tray-slogan",
  "tray-feed",
  "tray-chat",
  "tray-meet",
  "tray-call",
]

const START: Draft = { flags: new Set(["n0", "tray-alone", "lonely", "waiting"]), count: 0 }

// Reduced motion: the last meeting scene, everyone seated, no loop.
const STATIC: Draft = {
  flags: new Set([
    "n5",
    "tray-meet",
    "started",
    "meet",
    "landed",
    ...[0, 1, 2, 3, 4].map((i) => `on${i}`),
  ]),
  count: 5,
}

const scene = (d: Draft, n: number, tray?: string) => {
  SCENES.forEach((c) => d.flags.delete(c))
  d.flags.add(`n${n}`)
  if (tray) d.flags.add(tray)
}
const add = (d: Draft, ...names: string[]) => names.forEach((n) => d.flags.add(n))
const remove = (d: Draft, ...names: string[]) => names.forEach((n) => d.flags.delete(n))
const seat = (d: Draft, i: number, count: number) => {
  add(d, `on${i}`)
  d.count = count
}

function beats(isDesktop: boolean): Beat[] {
  const late = isDesktop ? 600 : 0
  const list: Beat[] = [
    [500, (d) => add(d, "think")],
    [
      2800,
      (d) => {
        remove(d, "think")
        scene(d, 0, "tray-slogan")
      },
    ],
    [
      4600,
      (d) => {
        remove(d, "lonely", "think")
        scene(d, 1)
        add(d, "onb")
      },
    ],
    [5600, (d) => add(d, "pick1")],
    [6300, (d) => add(d, "pick2")],
    [7000, (d) => add(d, "pick3")],
    [7500, (d) => add(d, "filled")],
    [
      8200,
      (d) => {
        remove(d, "onb")
        scene(d, 2, "tray-feed")
      },
    ],
    [8700, (d) => seat(d, 1, 1)],
    [9100, (d) => seat(d, 2, 2)],
    [late + 10100, (d) => add(d, "clicking")],
    [
      late + 10350,
      (d) => {
        remove(d, "clicking")
        add(d, "go")
      },
    ],
    // The solo blobatar lands on seat 0. `arrive` skips the seat's pop-in so the swap is seamless.
    [
      late + 10700,
      (d) => {
        add(d, "on0", "arrive", "landed")
        remove(d, "waiting")
        d.count = 3
      },
    ],
    [late + 10760, (d) => remove(d, "arrive")],
    [late + 10600, (d) => scene(d, 3)],
    [late + 11100, (d) => seat(d, 3, 4)],
    [
      late + 11500,
      (d) => {
        seat(d, 4, 5)
        add(d, "full")
      },
    ],
    [
      late + 12200,
      (d) => {
        add(d, "started")
        remove(d, "full")
      },
    ],
    [late + 14200, (d) => scene(d, 4, "tray-chat")],
    [late + 14900, (d) => add(d, "chat-msg")],
    [late + 15800, (d) => add(d, "chat-msg2")],
    [
      late + 17600,
      (d) => {
        scene(d, 5, "tray-meet")
        add(d, "meet")
      },
    ],
    [
      late + 20200,
      (d) => {
        scene(d, 5, "tray-call")
        add(d, "call")
      },
    ],
    // The five seats melt into the logo.
    [late + 22600, (d) => add(d, "logo")],
    [late + 25700, (d) => add(d, "fade")],
  ]
  if (isDesktop) {
    list.push([9700, (d) => add(d, "cursor-go")], [late + 10600, (d) => add(d, "cursor-done")])
  }
  return list
}

const LOOP_MS = 26300

/** State classes (without the `ci-` prefix) and the seat count, advancing on a loop. */
export function useCoreIdeaTimeline(isDesktop: boolean, isStatic: boolean) {
  const [state, setState] = useState<Draft>(START)

  useEffect(() => {
    if (isStatic) return
    const timers: number[] = []
    const at = (ms: number, apply: (draft: Draft) => void) =>
      timers.push(
        window.setTimeout(
          () =>
            setState((prev) => {
              const next = { flags: new Set(prev.flags), count: prev.count }
              apply(next)
              return next
            }),
          ms,
        ),
      )

    const run = () => {
      // `snap` switches every transition off for the frame that cuts back to the start.
      setState({ flags: new Set(["snap", ...START.flags]), count: 0 })
      at(60, (d) => remove(d, "snap"))
      for (const [ms, apply] of beats(isDesktop)) at(ms + 60, apply)
      timers.push(window.setTimeout(run, (isDesktop ? LOOP_MS + 600 : LOOP_MS) + 60))
    }
    timers.push(window.setTimeout(run, 300))

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [isDesktop, isStatic])

  return isStatic ? STATIC : state
}
