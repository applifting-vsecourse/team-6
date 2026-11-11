import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMascotContext, useMascotStage } from "@/components/Mascot/MascotContext"

import { cardInView } from "@/features/profile/lib/cardInView"

export type GuideCard = {
  /** The card's mascot anchor is `onboarding-<id>`. */
  id: string
  text: string
  isDone: boolean
  /**
   * What the person has answered, as a string that changes whenever the answer does. The mascot
   * follows the person: an answer given in another card sends it there.
   */
  answer: string
  /** An optional card can be passed over with "Next" in the bubble. */
  isOptional?: boolean
  /**
   * More than one answer is possible (several tags, several days, free text). The mascot then
   * never decides by itself that the card is finished: it stays until the person presses "Next"
   * (shown once there is an answer) or answers something in another card. Otherwise the first
   * pick would send it on, and make it look as if one pick were all that is asked for.
   */
  isManual?: boolean
}

type OnboardingGuide = {
  /** The person's avatar seed; without it there is no guide. */
  seed?: string
  cards: GuideCard[]
  /** What the mascot says at the button once every card is answered or passed over. */
  readyText: string
}

/** Where the mascot stands once every card is answered: the button that moves the person on. */
export const GUIDE_READY_ID = "onboarding-continue"
const READY = "ready"

type GuideState = {
  answers: Record<string, string>
  activeId: string
  /** The mascot moved because the person answered somewhere else: the card is in view already. */
  isFollowing: boolean
  /** Cards the person has left with "Next" without an answer: they no longer hold the mascot back. */
  passedIds: string[]
}

const snapshot = (cards: GuideCard[]) =>
  Object.fromEntries(cards.map((card) => [card.id, card.answer]))

/** The first card after this one that still needs the person, or the button when none does. */
function nextAfter(cards: GuideCard[], id: string): string {
  const index = cards.findIndex((card) => card.id === id)
  return cards.slice(index + 1).find((card) => !card.isDone)?.id ?? READY
}

/** Moves the mascot to where the person just answered, and on if that card is finished by it. */
function follow(state: GuideState, cards: GuideCard[]): GuideState {
  const changed = cards.filter((card) => state.answers[card.id] !== card.answer)
  let activeId = state.activeId
  let isFollowing = state.isFollowing

  for (const card of changed) {
    if (card.id !== activeId) isFollowing = true
    activeId = card.id
    // One answer is all such a card takes: on to the next.
    if (!card.isManual && card.isDone) {
      activeId = nextAfter(cards, card.id)
      isFollowing = false
    }
  }
  return { ...state, answers: snapshot(cards), activeId, isFollowing }
}

// How long the page may scroll on its own (to a card, or to the top of a new step) before the
// person's own scrolling counts again, and how long it must rest before the mascot follows it.
const OWN_SCROLL_MS = 1200
const SCROLL_REST_MS = 150

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Walks the mascot over the cards of one onboarding step. It sticks to a card and explains it,
 * and follows the person: "Next" or a finished single answer sends it to the next card, an answer
 * given in another card sends it there. After the last card it waits at the button.
 * It only speaks while the tour is running; otherwise the step looks as it always did.
 */
export function useOnboardingGuide({ seed, cards, readyText }: OnboardingGuide) {
  const { t } = useTranslation()
  const mascot = useMascotContext()
  const isGuiding = Boolean(mascot?.isTourActive && seed)

  const [state, setState] = useState<GuideState>(() => ({
    answers: snapshot(cards),
    activeId: cards[0]?.id ?? READY,
    isFollowing: false,
    passedIds: [],
  }))

  // Answers changed since the last render: settle where the mascot goes before drawing anything.
  const hasChanged = cards.some((card) => state.answers[card.id] !== card.answer)
  const current = hasChanged ? follow(state, cards) : state
  if (hasChanged) setState(current)

  const card = cards.find((item) => item.id === current.activeId)
  const text = card?.text ?? readyText
  const anchorId = card ? `onboarding-${card.id}` : GUIDE_READY_ID
  const nextId = card ? nextAfter(cards, card.id) : READY
  // Next: a manual card can be left once it has an answer; an optional one at any time.
  const hasNext = card ? card.isOptional === true || (card.isManual === true && card.isDone) : false

  const passedId = card?.id
  const pass = useCallback(
    () =>
      setState((previous) => ({
        ...previous,
        activeId: nextId,
        isFollowing: false,
        passedIds: passedId ? [...previous.passedIds, passedId] : previous.passedIds,
      })),
    [nextId, passedId],
  )

  const stage = useMemo(
    () =>
      isGuiding
        ? {
            anchorId,
            seed,
            bubble: {
              text,
              isClosable: true,
              prefer: "beside" as const,
              actions: hasNext ? [{ label: t("tour.next"), onClick: pass }] : undefined,
            },
          }
        : null,
    [isGuiding, anchorId, seed, text, hasNext, pass, t],
  )
  useMascotStage(stage)

  // Bring the card into view when the mascot moves on to it, so it never waits off screen. Not for
  // the first card (the page opens on it), nor when the person just answered there: it is in view,
  // and the page must not slide away under their hand. The page's own scrolling is not the
  // person's, so it must not send the mascot elsewhere.
  const ownScrollUntil = useRef(0)
  useEffect(() => {
    ownScrollUntil.current = performance.now() + OWN_SCROLL_MS
  }, [])
  const resolveAnchor = mascot?.resolveAnchor
  const isFirstStop = useRef(true)
  const isFollowing = useRef(false)
  const isFollowingNow = current.isFollowing
  useEffect(() => {
    isFollowing.current = isFollowingNow
  }, [isFollowingNow])
  useEffect(() => {
    if (!isGuiding) return
    if (isFirstStop.current) {
      isFirstStop.current = false
      return
    }
    if (isFollowing.current) return
    const frame = requestAnimationFrame(() => {
      const anchor = resolveAnchor?.(anchorId)
      ownScrollUntil.current = performance.now() + OWN_SCROLL_MS
      // The card, not the corner on its edge, so that the card is what ends up in the middle.
      ;(anchor?.parentElement ?? anchor)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [isGuiding, anchorId, resolveAnchor])

  // The person scrolls: the mascot goes to the card they have come to, once the page has come to
  // rest. It never goes further down than the first card still left empty, required or not (one
  // left with "Next" counts as dealt with): scroll past that one and it stays there. Up is free.
  // The button is a stop of its own, but only when every card is answered.
  const gate = cards.findIndex((card) => !card.isDone && !current.passedIds.includes(card.id))
  const stops = (gate === -1 ? cards : cards.slice(0, gate + 1)).map((card) => card.id)
  if (cards.every((card) => card.isDone)) stops.push(READY)
  const stopsKey = stops.join("|")
  useEffect(() => {
    if (!isGuiding || !resolveAnchor) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const settle = () => {
      const placed = stopsKey.split("|").flatMap((id) => {
        const holder = resolveAnchor(
          id === READY ? GUIDE_READY_ID : `onboarding-${id}`,
        )?.parentElement
        if (!holder) return []
        const { top, bottom } = holder.getBoundingClientRect()
        return [{ id, top, bottom }]
      })
      const id = cardInView(placed, window.innerHeight)
      if (id) {
        setState((previous) =>
          previous.activeId === id ? previous : { ...previous, activeId: id, isFollowing: true },
        )
      }
    }
    const onScroll = () => {
      // The page scrolling by itself (to a card, to the top of a step) is not the person.
      if (performance.now() < ownScrollUntil.current) return
      clearTimeout(timer)
      timer = setTimeout(settle, SCROLL_REST_MS)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      clearTimeout(timer)
    }
  }, [isGuiding, resolveAnchor, stopsKey])
}
