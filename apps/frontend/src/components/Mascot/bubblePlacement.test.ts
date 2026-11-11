import { placeBubble, preferredBubbleWidth } from "./bubblePlacement"

const rect = (left: number, top: number, width: number, height = width) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

const DESKTOP = { width: 1280, height: 800 }
const PHONE = { width: 375, height: 700 }

describe("placeBubble beside the mascot", () => {
  it("opens to the right when there is room beside the mascot", () => {
    expect(placeBubble(rect(300, 400, 48), DESKTOP).side).toBe("right")
  })

  it("opens above when asked to, so it stays off a button beside the mascot", () => {
    const layout = placeBubble(rect(300, 400, 48), DESKTOP, { prefer: "above" })

    expect(layout.side).toBe("above")
    expect(layout.bottom).toBe(DESKTOP.height - 400 + 14)
  })

  it("ignores that wish where there is no room above", () => {
    expect(placeBubble(rect(300, 120, 48), DESKTOP, { prefer: "above" }).side).toBe("right")
  })

  it("opens to the left when the mascot sits at the right edge", () => {
    expect(placeBubble(rect(1100, 400, 48), DESKTOP).side).toBe("left")
  })

  it("opens above on a phone, where neither side has room", () => {
    expect(placeBubble(rect(300, 400, 48), PHONE).side).toBe("above")
  })

  it("opens to the left of the tour slot at the top right of the window", () => {
    const layout = placeBubble(rect(1192, 96, 56), DESKTOP)

    expect(layout.side).toBe("left")
    expect(layout.top).toBe(96)
    expect(layout.tailY).toBe(28)
  })

  it("opens downwards from the tour slot on a phone, away from the header", () => {
    expect(placeBubble(rect(303, 80, 56), PHONE).side).toBe("below")
  })

  it("speaks downwards from the header", () => {
    expect(placeBubble(rect(1200, 12, 30), DESKTOP).side).toBe("below")
  })

  it("keeps the bubble on screen and its tail aimed at the mascot", () => {
    const layout = placeBubble(rect(1200, 12, 30), DESKTOP)

    expect(layout.left + layout.width).toBeLessThanOrEqual(1280 - 16)
    expect(layout.left + layout.tailX).toBeCloseTo(1215)
  })

  it("never grows wider than the screen allows", () => {
    expect(placeBubble(rect(10, 400, 48), { width: 300, height: 700 }).width).toBe(268)
  })

  it("tells the bubble how far it may grow, so longer text wraps instead", () => {
    expect(placeBubble(rect(300, 400, 48), DESKTOP).maxWidth).toBe(280)
    expect(placeBubble(rect(300, 400, 48), { width: 300, height: 700 }).maxWidth).toBe(268)
  })

  it("uses the width the text asks for, up to the maximum", () => {
    expect(placeBubble(rect(10, 400, 48), DESKTOP, { preferredWidth: 150 }).width).toBe(150)
    expect(placeBubble(rect(10, 400, 48), DESKTOP, { preferredWidth: 900 }).width).toBe(280)
  })
})

describe("placeBubble beside a card", () => {
  it("opens to the right of the mascot when the window has room beside the card", () => {
    const layout = placeBubble(rect(780, 300, 44), DESKTOP, { prefer: "beside" })

    expect(layout.side).toBe("right")
    expect(layout.top).toBe(300)
  })

  it("docks to the bottom of the window when there is no room beside the card", () => {
    const layout = placeBubble(rect(330, 300, 44), PHONE, { preferredWidth: 400, prefer: "beside" })

    expect(layout.side).toBe("dock")
    expect(layout.bottom).toBe(16)
    expect(layout.left + layout.width / 2).toBeCloseTo(PHONE.width / 2)
    expect(layout.left).toBeGreaterThanOrEqual(0)
    expect(layout.left + layout.width).toBeLessThanOrEqual(PHONE.width)
  })

  it("never opens left or above, where it would cover the card", () => {
    const sides = [
      placeBubble(rect(600, 300, 44), { width: 800, height: 700 }, { prefer: "beside" }).side,
      placeBubble(rect(600, 40, 44), { width: 800, height: 700 }, { prefer: "beside" }).side,
    ]

    expect(sides.every((side) => side === "right" || side === "dock")).toBe(true)
  })
})

describe("placeBubble in a slot", () => {
  // The room above the buttons on the landing page, with the mascot on the corner of one.
  const slot = rect(80, 300, 352, 56)
  const mascot = rect(380, 376, 48)

  it("sits inside the slot above the mascot, never lower than its bottom edge", () => {
    const layout = placeBubble(mascot, DESKTOP, { preferredWidth: 190, slot })

    expect(layout.side).toBe("above")
    expect(layout.bottom).toBe(DESKTOP.height - slot.bottom)
    expect(layout.left).toBeGreaterThanOrEqual(slot.left)
    expect(layout.left + layout.width).toBeLessThanOrEqual(slot.right)
  })

  it("leans toward the mascot and points its tail at it", () => {
    const layout = placeBubble(mascot, DESKTOP, { preferredWidth: 190, slot })

    expect(layout.left + layout.tailX).toBeCloseTo(404)
  })

  it("sits in a slot below the mascot with its top edge on the slot", () => {
    const below = rect(80, 500, 400, 80)
    const layout = placeBubble(rect(240, 150, 160), DESKTOP, { preferredWidth: 300, slot: below })

    expect(layout.side).toBe("below")
    expect(layout.top).toBe(500)
    expect(layout.left + layout.width / 2).toBeCloseTo(320)
  })

  it("is no wider than the slot, nor than the slot cap", () => {
    expect(
      placeBubble(mascot, DESKTOP, { preferredWidth: 900, slot: rect(80, 300, 200, 56) }).width,
    ).toBe(200)
    expect(
      placeBubble(mascot, DESKTOP, { preferredWidth: 900, slot: rect(80, 300, 700, 56) }).width,
    ).toBe(360)
  })
})

describe("preferredBubbleWidth", () => {
  it("hugs a short greeting", () => {
    expect(preferredBubbleWidth({ text: "Let's get started!" })).toBeLessThan(200)
  })

  it("asks for more room for a longer text", () => {
    expect(preferredBubbleWidth({ text: "x".repeat(120) })).toBeGreaterThan(280)
  })

  it("leaves room for two buttons under a short line", () => {
    const actions = [
      { label: "Skip", onClick: () => undefined },
      { label: "Next", onClick: () => undefined },
    ]

    expect(preferredBubbleWidth({ text: "Hi", actions })).toBe(220)
  })
})
