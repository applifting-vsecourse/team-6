import { useEffect, useState } from "react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MascotProvider, useMascotContext } from "@/components/Mascot/MascotContext"
import { MascotCorner } from "@/components/Mascot/MascotCorner"

import { useOnboardingGuide } from "./useOnboardingGuide"

function TourOn() {
  const setTourActive = useMascotContext()?.setTourActive
  useEffect(() => setTourActive?.(true), [setTourActive])
  return null
}

function Probe() {
  const stage = useMascotContext()?.stage
  return (
    <div>
      <p data-testid="anchor">{stage?.anchorId ?? "none"}</p>
      <p data-testid="text">{stage?.bubble?.text ?? "none"}</p>
      <p data-testid="seed">{stage?.seed ?? "none"}</p>
      {stage?.bubble?.actions?.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

// A step like the real ones: a role (several allowed), topics (several, optional), a frequency
// (one answer) and a note (free text, optional). Each answer has a button to give it.
function Step({ seed = "petr" }: { seed?: string }) {
  const [roles, setRoles] = useState(0)
  const [topics, setTopics] = useState(0)
  const [frequency, setFrequency] = useState("")
  const [note, setNote] = useState("")
  useOnboardingGuide({
    seed,
    readyText: "Ready",
    cards: [
      {
        id: "role",
        text: "Pick roles",
        isDone: roles > 0,
        answer: String(roles),
        isManual: true,
      },
      {
        id: "topics",
        text: "Pick topics",
        isDone: topics > 0,
        answer: String(topics),
        isOptional: true,
        isManual: true,
      },
      { id: "frequency", text: "Pick a frequency", isDone: frequency !== "", answer: frequency },
      {
        id: "note",
        text: "Write a note",
        isDone: note !== "",
        answer: note,
        isOptional: true,
        isManual: true,
      },
    ],
  })
  return (
    <>
      <button onClick={() => setRoles((count) => count + 1)}>add role</button>
      <button onClick={() => setTopics((count) => count + 1)}>add topic</button>
      <button onClick={() => setFrequency("WEEKLY")}>choose weekly</button>
      <button onClick={() => setNote("hello")}>write note</button>
    </>
  )
}

const renderStep = (props: { seed?: string; isTourOn?: boolean } = {}) =>
  render(
    <MascotProvider>
      {props.isTourOn === false ? null : <TourOn />}
      <Probe />
      <Step seed={props.seed} />
    </MascotProvider>,
  )

const click = (name: string) => userEvent.click(screen.getByRole("button", { name }))
const expectAnchor = (anchor: string) =>
  expect(screen.getByTestId("anchor")).toHaveTextContent(anchor)

describe("useOnboardingGuide", () => {
  it("starts on the first card, as the person's own avatar", () => {
    renderStep()

    expectAnchor("onboarding-role")
    expect(screen.getByTestId("text")).toHaveTextContent("Pick roles")
    expect(screen.getByTestId("seed")).toHaveTextContent("petr")
  })

  it("stays on a card with several answers however many are given", async () => {
    renderStep()

    await click("add role")
    await click("add role")

    expectAnchor("onboarding-role")
  })

  it("moves on when Next is pressed, which a required card offers only once it has an answer", async () => {
    renderStep()
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()

    await click("add role")
    await click("Next")

    expectAnchor("onboarding-topics")
  })

  it("lets the person leave an optional card without an answer", async () => {
    renderStep()
    await click("add role")
    await click("Next")

    await click("Next")

    expectAnchor("onboarding-frequency")
  })

  it("follows the person to another card where they give an answer", async () => {
    renderStep()
    await click("add role")

    // Never pressed Next: the answer given further down takes the mascot there.
    await click("add topic")

    expectAnchor("onboarding-topics")
    expect(screen.getByTestId("text")).toHaveTextContent("Pick topics")
  })

  it("goes back up when an earlier card is answered again", async () => {
    renderStep()
    await click("add role")
    await click("add topic")

    await click("add role")

    expectAnchor("onboarding-role")
  })

  it("moves on by itself after a card that takes one answer", async () => {
    renderStep()

    await click("choose weekly")

    // Gives its answer in a card further down, then goes on to the first one after it that is left.
    expectAnchor("onboarding-note")
  })

  it("ends at the button once nothing is left", async () => {
    renderStep()
    await click("add role")
    await click("Next")
    await click("Next")
    await click("choose weekly")
    await click("write note")
    await click("Next")

    expectAnchor("onboarding-continue")
    expect(screen.getByTestId("text")).toHaveTextContent("Ready")
  })

  it("says nothing when the tour is not running or there is no avatar", () => {
    const { unmount } = renderStep({ isTourOn: false })
    expectAnchor("none")
    unmount()

    renderStep({ seed: "" })
    expectAnchor("none")
  })

  it("does nothing outside a provider", () => {
    render(<Step />)

    expect(screen.getByRole("button", { name: "add role" })).toBeInTheDocument()
  })

  describe("while the person scrolls", () => {
    const rects: Record<string, { top: number; bottom: number }> = {}

    function Card({ id }: { id: string }) {
      return (
        <section
          ref={(element) => {
            if (!element) return
            element.getBoundingClientRect = () =>
              ({ ...rects[id], left: 0, right: 0, width: 0, height: 0 }) as DOMRect
          }}
        >
          <MascotCorner id={`onboarding-${id}`} />
        </section>
      )
    }

    // Whether the first card (required) has been answered, and whether the second is optional.
    const setup = { isRoleDone: true, isTopicsOptional: false }

    function Scrolled() {
      useOnboardingGuide({
        seed: "petr",
        readyText: "Ready",
        cards: [
          { id: "role", text: "Pick roles", isDone: setup.isRoleDone, answer: "" },
          {
            id: "topics",
            text: "Pick topics",
            isDone: false,
            answer: "",
            isOptional: setup.isTopicsOptional,
          },
          { id: "note", text: "Write a note", isDone: false, answer: "", isOptional: true },
        ],
      })
      return (
        <>
          <Card id="role" />
          <Card id="topics" />
          <Card id="note" />
        </>
      )
    }

    const scrollTo = (positions: typeof rects, rest: number) => {
      Object.assign(rects, positions)
      act(() => {
        window.dispatchEvent(new Event("scroll"))
        vi.advanceTimersByTime(rest)
      })
    }

    const mount = (options: { isSettled: boolean } = { isSettled: true }) => {
      render(
        <MascotProvider>
          <TourOn />
          <Probe />
          <Scrolled />
        </MascotProvider>,
      )
      // Past the time the page is allowed to scroll by itself when a step opens.
      if (options.isSettled) act(() => void vi.advanceTimersByTime(1300))
    }

    beforeEach(() => {
      // The guide reads `performance.now()` to tell its own scrolling from the person's.
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] })
      window.innerHeight = 800
      // jsdom lays nothing out, so no anchor would count as on screen.
      vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([new DOMRect()] as never)
      Object.assign(rects, {
        role: { top: 100, bottom: 300 },
        topics: { top: 324, bottom: 500 },
        note: { top: 524, bottom: 700 },
      })
      Object.assign(setup, { isRoleDone: true, isTopicsOptional: false })
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it("goes to the card the middle of the window has come to, once the page rests", () => {
      mount()
      expectAnchor("onboarding-role")

      scrollTo({ role: { top: -400, bottom: -200 }, topics: { top: 350, bottom: 600 } }, 200)

      expectAnchor("onboarding-topics")
    })

    it("waits for the scrolling to stop before it moves", () => {
      mount()
      scrollTo({ role: { top: -400, bottom: -200 }, topics: { top: 350, bottom: 600 } }, 50)

      expectAnchor("onboarding-role")
    })

    it("goes back to an earlier card when the person scrolls up to it", () => {
      mount()
      scrollTo({ role: { top: -400, bottom: -200 }, topics: { top: 350, bottom: 600 } }, 200)
      scrollTo({ role: { top: 350, bottom: 600 }, topics: { top: 624, bottom: 900 } }, 200)

      expectAnchor("onboarding-role")
    })

    it("stays at a required card that is still empty when the person scrolls past it", () => {
      setup.isRoleDone = false
      mount()
      expectAnchor("onboarding-role")

      // Scrolled down to the second card, with the first one not answered.
      scrollTo({ role: { top: -400, bottom: -200 }, topics: { top: 350, bottom: 600 } }, 200)

      expectAnchor("onboarding-role")
    })

    it("goes as far down as the first required card that is empty, no further", () => {
      setup.isRoleDone = true
      mount()

      // The second card is required and empty, so the note below it is out of reach.
      scrollTo(
        {
          role: { top: -900, bottom: -700 },
          topics: { top: -400, bottom: -200 },
          note: { top: 350, bottom: 600 },
        },
        200,
      )

      expectAnchor("onboarding-topics")
    })

    it("holds the mascot at an empty optional card too, until it is answered or left with Next", () => {
      setup.isRoleDone = true
      setup.isTopicsOptional = true
      mount()

      scrollTo(
        {
          role: { top: -900, bottom: -700 },
          topics: { top: -400, bottom: -200 },
          note: { top: 350, bottom: 600 },
        },
        200,
      )
      expectAnchor("onboarding-topics")
    })

    it("lets the person on past an optional card they left with Next", () => {
      setup.isRoleDone = true
      setup.isTopicsOptional = true
      mount()
      // Scroll down to the optional card, then leave it without an answer.
      scrollTo(
        {
          role: { top: -900, bottom: -700 },
          topics: { top: 350, bottom: 600 },
          note: { top: 624, bottom: 800 },
        },
        200,
      )
      expectAnchor("onboarding-topics")
      act(() => screen.getByRole("button", { name: "Next" }).click())
      expectAnchor("onboarding-note")

      scrollTo(
        {
          role: { top: -900, bottom: -700 },
          topics: { top: -400, bottom: -200 },
          note: { top: 350, bottom: 600 },
        },
        200,
      )

      expectAnchor("onboarding-note")
    })

    it("lets the person scroll back up from the card it holds, however empty the ones above", () => {
      setup.isRoleDone = false
      mount()

      scrollTo(
        {
          role: { top: 350, bottom: 600 },
          topics: { top: 624, bottom: 800 },
          note: { top: 824, bottom: 900 },
        },
        200,
      )

      expectAnchor("onboarding-role")
    })

    it("does not take the page's own scrolling for the person's", () => {
      // A step has just opened and the page is still gliding to its top.
      mount({ isSettled: false })

      scrollTo({ role: { top: -400, bottom: -200 }, topics: { top: 350, bottom: 600 } }, 200)

      expectAnchor("onboarding-role")
    })
  })
})
