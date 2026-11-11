import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

/** Seed of the yellow mascot. The blobatar package turns it into `#ffcd44`, "you" in the core-idea animation. */
export const MASCOT_SEED = "jana"

// How long the mascot waits for the next page to claim it before it leaves. Navigation unmounts the
// old page first, and a lazily loaded route can take a moment to mount.
const GRACE_MS = 1500

export type MascotAction = {
  label: string
  onClick: () => void
  variant?: "default" | "ghost"
}

export type MascotBubble = {
  text: string
  /** Room a page set aside for this bubble (`MascotBubbleSlot`). Without it, it opens beside the mascot. */
  slotId?: string
  /**
   * Without a slot: `above` the mascot, or `beside` it, where it must not cover the page, and
   * with no room beside it the bubble docks to the bottom of the window.
   */
  prefer?: "above" | "beside"
  actions?: MascotAction[]
  /**
   * Shows a close cross in the top right corner. It only hides the bubble: the mascot stays, and a
   * click on it brings the bubble back. A new text opens it again, so a guide keeps guiding.
   */
  isClosable?: boolean
}

export type MascotStage = {
  /** Which anchor (see `useMascotAnchor`) the mascot flies to. */
  anchorId: string
  /** A person's seed: the mascot cross-fades into that avatar. Leave out for the yellow mascot. */
  seed?: string
  bubble?: MascotBubble
}

type MascotContextValue = {
  stage: MascotStage | null
  /** Puts the mascot on a stage at once, or takes it away (`null`). */
  setStage: (stage: MascotStage | null) => void
  /**
   * A page lets go of its stage. The mascot leaves only if that stage is still the current one
   * once the grace time is over: a page that mounted meanwhile has taken over, and stays.
   */
  releaseStage: (stage: MascotStage) => void
  registerAnchor: (id: string, element: HTMLElement) => () => void
  /** The first element of that anchor that is on screen, e.g. the desktop or the phone avatar. */
  resolveAnchor: (id: string) => HTMLElement | null
  /** Called whenever an anchor appears or disappears. */
  subscribe: (listener: () => void) => () => void
  /** The tour is running: the header keeps its own avatar back until the mascot lands there. */
  isTourActive: boolean
  setTourActive: (isActive: boolean) => void
  replayToken: number
  replayTour: () => void
}

const MascotContext = createContext<MascotContextValue | null>(null)

export function MascotProvider({ children }: { children: ReactNode }) {
  const [stage, setStageState] = useState<MascotStage | null>(null)
  const [replayToken, setReplayToken] = useState(0)
  const [isTourActive, setTourActive] = useState(false)
  const anchors = useRef(new Map<string, Set<HTMLElement>>())
  const listeners = useRef(new Set<() => void>())
  // One pending release per stage, so a stage that is put back is not taken away by its own timer.
  const leaveTimers = useRef(new Map<MascotStage, ReturnType<typeof setTimeout>>())

  const setStage = useCallback<MascotContextValue["setStage"]>((next) => {
    // StrictMode runs a page's effect, tears it down and runs it again with the very same stage:
    // the release that teardown scheduled must not outlive the stage being put back.
    if (next) {
      clearTimeout(leaveTimers.current.get(next))
      leaveTimers.current.delete(next)
    }
    setStageState(next)
  }, [])

  const releaseStage = useCallback<MascotContextValue["releaseStage"]>((released) => {
    clearTimeout(leaveTimers.current.get(released))
    const timer = setTimeout(() => {
      leaveTimers.current.delete(released)
      // Only the stage that was released may go. The page on the way out can be torn down after the
      // next one has mounted (the router shows the new location before it swaps the page), and it
      // must not take the new page's stage with it.
      setStageState((current) => (current === released ? null : current))
    }, GRACE_MS)
    leaveTimers.current.set(released, timer)
  }, [])

  useEffect(() => {
    const timers = leaveTimers.current
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [])

  const registerAnchor = useCallback((id: string, element: HTMLElement) => {
    const set = anchors.current.get(id) ?? new Set<HTMLElement>()
    set.add(element)
    anchors.current.set(id, set)
    listeners.current.forEach((listener) => listener())
    return () => {
      set.delete(element)
      listeners.current.forEach((listener) => listener())
    }
  }, [])

  const resolveAnchor = useCallback((id: string) => {
    for (const element of anchors.current.get(id) ?? []) {
      if (element.getClientRects().length > 0) return element
    }
    return null
  }, [])

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const replayTour = useCallback(() => setReplayToken((token) => token + 1), [])

  const value = useMemo(
    () => ({
      stage,
      setStage,
      releaseStage,
      registerAnchor,
      resolveAnchor,
      subscribe,
      isTourActive,
      setTourActive,
      replayToken,
      replayTour,
    }),
    [
      stage,
      setStage,
      releaseStage,
      registerAnchor,
      resolveAnchor,
      subscribe,
      isTourActive,
      replayToken,
      replayTour,
    ],
  )

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}

/** `null` outside a provider, so components that carry anchors still render in isolation. */
export const useMascotContext = () => useContext(MascotContext)

/**
 * Marks an element as a place the mascot can fly to: `[attach, isOccupied]`. `isOccupied` is true
 * while the mascot is there, so the page can hide its own copy of the avatar and avoid showing it twice.
 */
export function useMascotAnchor(id: string) {
  const context = useMascotContext()
  const registerAnchor = context?.registerAnchor

  const attach = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !registerAnchor) return
      return registerAnchor(id, element)
    },
    [id, registerAnchor],
  )

  return [attach, context?.stage?.anchorId === id] as const
}

/** Puts the mascot on a stage while the calling page is mounted. Pass a memoized value. */
export function useMascotStage(stage: MascotStage | null) {
  const context = useMascotContext()
  const setStage = context?.setStage
  const releaseStage = context?.releaseStage

  useEffect(() => {
    if (!setStage || !releaseStage || !stage) return
    setStage(stage)
    return () => releaseStage(stage)
  }, [setStage, releaseStage, stage])
}
