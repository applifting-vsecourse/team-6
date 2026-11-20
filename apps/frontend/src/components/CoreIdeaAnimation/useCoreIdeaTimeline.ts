import { useEffect, useRef, useState } from "react"

/**
 * The script of the landing animation: a set of state classes on the stage plus the seat count.
 * CSS does all the moving; this only says which scene is on and when. Times are in ms from the
 * start of a loop, as measured on the phone stage; the desktop stage waits 600 ms longer for the
 * pointer to travel to the Join button.
 */
type Draft = { flags: Set<string>; count: number }
type Beat = readonly [at: number, apply: (draft: Draft) => void]

const SCENES = ["n0", "n1", "n2", "n3", "tray-alone", "tray-slogan", "tray-feed"]

const START: Draft = { flags: new Set(["n0", "tray-alone", "lonely", "waiting"]), count: 0 }

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
    // Each seat shows what it can teach and what it wants to learn (still empty); then each
    // empty one is filled by a copy of the next person's tag flying over, and the seat gets a tick.
    [late + 13000, (d) => add(d, "tagged")],
    [late + 14000, (d) => add(d, "solved")],
    // The five regroup into the logo's cluster and the wordmark appears under them; then it all fades.
    [late + 18200, (d) => add(d, "regroup")],
    [late + 23400, (d) => add(d, "fade")],
  ]
  if (isDesktop) {
    list.push([9700, (d) => add(d, "cursor-go")], [late + 10600, (d) => add(d, "cursor-done")])
  }
  return list
}

const LOOP_MS = 24000

/** How long the story stays on a step, for the bar that fills while it plays. */
export const stepMs = (step: number, isDesktop: boolean) => {
  const late = isDesktop ? 600 : 0
  const starts = [0, 4600, 8200, late + 10600, late + 23400]
  return (starts[step + 1] ?? 0) - (starts[step] ?? 0)
}

// Every beat before the fade: all five seated, tagged and solved.
const END = 17000

/** Where the story is when someone jumps to a step. Without motion the last step is the whole ending. */
export const stepStart = (step: number, isDesktop: boolean, isStatic: boolean) =>
  isStatic && step === 3 ? END : ([0, 4600, 8200, (isDesktop ? 600 : 0) + 10760][step] ?? 0)

/** The scene as it stands `from` ms into the loop, with no motion in between. */
function sceneAt(isDesktop: boolean, from: number): Draft {
  const draft: Draft = { flags: new Set(START.flags), count: 0 }
  for (const [ms, apply] of beats(isDesktop).sort((a, b) => a[0] - b[0])) {
    if (ms <= from) apply(draft)
  }
  return draft
}

/**
 * State classes (without the `ci-` prefix) and the seat count, advancing on a loop. `from` is where
 * to start, in ms: playing or jumping there restarts the loop from that point. Reduced motion
 * plays nothing and holds the scene at `from`, the finished one unless a step was picked.
 */
export function useCoreIdeaTimeline(isDesktop: boolean, isStatic: boolean, from?: { at: number }) {
  const [state, setState] = useState<Draft>(START)
  const hasPlayed = useRef(false)

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

    const run = (offset: number) => {
      // `snap` switches every transition off for the frame that cuts to the scene.
      const first = sceneAt(isDesktop, offset)
      first.flags.add("snap")
      setState(first)
      at(60, (d) => remove(d, "snap"))
      for (const [ms, apply] of beats(isDesktop)) if (ms > offset) at(ms - offset + 60, apply)
      timers.push(
        window.setTimeout(() => run(0), (isDesktop ? LOOP_MS + 600 : LOOP_MS) - offset + 60),
      )
    }
    // The first start waits for the page to settle; a later one (a step was picked, the stage or
    // reduced motion changed) starts at once.
    timers.push(window.setTimeout(() => run(from?.at ?? 0), hasPlayed.current ? 0 : 300))
    hasPlayed.current = true

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [isDesktop, isStatic, from])

  return isStatic ? sceneAt(isDesktop, from?.at ?? END) : state
}
