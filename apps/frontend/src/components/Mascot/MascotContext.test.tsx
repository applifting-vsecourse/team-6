import { StrictMode, useMemo } from "react"
import { act, render, screen } from "@testing-library/react"

import {
  MascotProvider,
  useMascotAnchor,
  useMascotContext,
  useMascotStage,
  type MascotStage,
} from "./MascotContext"

function Probe() {
  const context = useMascotContext()
  return <p data-testid="probe">{context?.stage?.anchorId ?? "none"}</p>
}

function Page({ anchorId, seed }: { anchorId: string; seed?: string }) {
  const stage = useMemo<MascotStage>(() => ({ anchorId, seed }), [anchorId, seed])
  useMascotStage(stage)
  return null
}

function Anchor({ id, isVisible = true }: { id: string; isVisible?: boolean }) {
  const [attach, isOccupied] = useMascotAnchor(id)
  return (
    <span
      ref={(element) => {
        if (element) element.getClientRects = () => (isVisible ? [new DOMRect()] : []) as never
        return attach(element)
      }}
      data-testid={`${id}-${isVisible ? "visible" : "hidden"}`}
      data-occupied={isOccupied}
    />
  )
}

describe("Mascot context", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("puts the mascot on the stage while a page is mounted", () => {
    const { unmount } = render(
      <MascotProvider>
        <Probe />
        <Page anchorId="landing-cta" />
      </MascotProvider>,
    )

    expect(screen.getByTestId("probe")).toHaveTextContent("landing-cta")
    unmount()
  })

  it("waits for the next page before it leaves", () => {
    const { rerender } = render(
      <MascotProvider>
        <Probe />
        <Page anchorId="landing-cta" />
      </MascotProvider>,
    )

    // The old page goes first; the mascot must still be there when the next one mounts.
    rerender(
      <MascotProvider>
        <Probe />
      </MascotProvider>,
    )
    act(() => void vi.advanceTimersByTime(500))
    expect(screen.getByTestId("probe")).toHaveTextContent("landing-cta")

    rerender(
      <MascotProvider>
        <Probe />
        <Page anchorId="signup-avatar" />
      </MascotProvider>,
    )
    act(() => void vi.advanceTimersByTime(5000))
    expect(screen.getByTestId("probe")).toHaveTextContent("signup-avatar")
  })

  it("leaves once no page claims it", () => {
    const { rerender } = render(
      <MascotProvider>
        <Probe />
        <Page anchorId="landing-cta" />
      </MascotProvider>,
    )

    rerender(
      <MascotProvider>
        <Probe />
      </MascotProvider>,
    )
    act(() => void vi.advanceTimersByTime(2000))

    expect(screen.getByTestId("probe")).toHaveTextContent("none")
  })

  it("keeps the next page's stage when the page before it is torn down late", () => {
    // The router shows the new location before it swaps the page, so the page on the way out can
    // be unmounted after the next one has already taken the stage.
    function Old() {
      useMascotStage(useMemo(() => ({ anchorId: "onboarding-continue" }), []))
      return null
    }
    function Next() {
      useMascotStage(useMemo(() => ({ anchorId: "tour-page" }), []))
      return null
    }
    const { rerender } = render(
      <MascotProvider>
        <Probe />
        <Old />
      </MascotProvider>,
    )

    rerender(
      <MascotProvider>
        <Probe />
        <Old />
        <Next />
      </MascotProvider>,
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("tour-page")
    rerender(
      <MascotProvider>
        <Probe />
        <Next />
      </MascotProvider>,
    )
    act(() => void vi.advanceTimersByTime(5000))

    expect(screen.getByTestId("probe")).toHaveTextContent("tour-page")
  })

  it("keeps its stage under StrictMode, which sets it, tears it down and sets it again", () => {
    render(
      <StrictMode>
        <MascotProvider>
          <Probe />
          <Page anchorId="onboarding-role" />
        </MascotProvider>
      </StrictMode>,
    )
    act(() => void vi.advanceTimersByTime(5000))

    expect(screen.getByTestId("probe")).toHaveTextContent("onboarding-role")
  })

  it("picks the anchor that is on screen when an id has two", () => {
    function Resolve() {
      const context = useMascotContext()
      const element = context?.resolveAnchor("header-avatar")
      return <p data-testid="resolved">{element?.dataset.testid ?? "none"}</p>
    }

    const { rerender } = render(
      <MascotProvider>
        <Anchor
          id="header-avatar"
          isVisible={false}
        />
        <Anchor id="header-avatar" />
        <Resolve />
      </MascotProvider>,
    )
    // Registration happens after the first render, so look again.
    rerender(
      <MascotProvider>
        <Anchor
          id="header-avatar"
          isVisible={false}
        />
        <Anchor id="header-avatar" />
        <Resolve />
      </MascotProvider>,
    )

    expect(screen.getByTestId("resolved")).toHaveTextContent("header-avatar-visible")
  })

  it("tells an anchor when the mascot stands on it", () => {
    render(
      <MascotProvider>
        <Anchor id="signup-avatar" />
        <Page anchorId="signup-avatar" />
      </MascotProvider>,
    )

    expect(screen.getByTestId("signup-avatar-visible")).toHaveAttribute("data-occupied", "true")
  })

  it("does nothing outside a provider, so pages render on their own", () => {
    render(
      <>
        <Anchor id="signup-avatar" />
        <Page anchorId="signup-avatar" />
      </>,
    )

    expect(screen.getByTestId("signup-avatar-visible")).toHaveAttribute("data-occupied", "false")
  })
})
