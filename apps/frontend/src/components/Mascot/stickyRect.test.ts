import { HOLDER_ATTRIBUTE, STICKY_ATTRIBUTE, stickyRect } from "./stickyRect"

const place = (element: HTMLElement, top: number, height: number, left = 100, width = 56) => {
  element.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect
}

function build(options: { anchorTop: number; cardBottom: number; mode?: string | null }) {
  const card = document.createElement("section")
  const anchor = document.createElement("span")
  if (options.mode !== null) anchor.setAttribute(STICKY_ATTRIBUTE, options.mode ?? "")
  card.append(anchor)
  place(anchor, options.anchorTop, 56)
  place(card, options.anchorTop + 32, options.cardBottom - options.anchorTop - 32)
  return anchor
}

describe("stickyRect", () => {
  it("leaves the anchor where it is while the card's corner is in view", () => {
    expect(stickyRect(build({ anchorTop: 300, cardBottom: 900 })).top).toBe(300)
  })

  it("stays under the header when the card's corner has scrolled past it", () => {
    expect(stickyRect(build({ anchorTop: -400, cardBottom: 900 })).top).toBe(72)
  })

  it("leaves with the bottom edge of the card", () => {
    const rect = stickyRect(build({ anchorTop: -400, cardBottom: 100 }))

    expect(rect.top).toBe(44)
    expect(rect.bottom).toBe(100)
  })

  it("keeps its column and size, and keeps talking", () => {
    const rect = stickyRect(build({ anchorTop: -400, cardBottom: 900 }))

    expect([rect.left, rect.right, rect.width, rect.height]).toEqual([100, 156, 56, 56])
    expect(rect.isQuiet).toBe(false)
  })

  it("takes an anchor without the mark as it is", () => {
    const anchor = build({ anchorTop: -400, cardBottom: 900, mode: null })

    expect(stickyRect(anchor).top).toBe(-400)
  })

  describe("small", () => {
    it("is full size and talks while it is in its place", () => {
      const rect = stickyRect(build({ anchorTop: 100, cardBottom: 900, mode: "small" }))

      expect([rect.top, rect.width, rect.isQuiet]).toEqual([100, 56, false])
    })

    it("shrinks towards its right edge and falls quiet once it is stuck", () => {
      const rect = stickyRect(build({ anchorTop: -400, cardBottom: 900, mode: "small" }))

      expect([rect.top, rect.width, rect.height, rect.right]).toEqual([72, 40, 40, 156])
      expect(rect.isQuiet).toBe(true)
    })

    it("glides down to its small size instead of snapping", () => {
      // 6px past the line: 6px smaller.
      expect(stickyRect(build({ anchorTop: 66, cardBottom: 900, mode: "small" })).width).toBe(50)
    })
  })

  it("rides along a marked holder further up, not just its parent", () => {
    const form = document.createElement("div")
    form.setAttribute(HOLDER_ATTRIBUTE, "")
    const row = document.createElement("div")
    const anchor = document.createElement("span")
    anchor.setAttribute(STICKY_ATTRIBUTE, "")
    row.append(anchor)
    form.append(row)
    place(anchor, -400, 56)
    place(row, -400, 56)
    place(form, -400, 1200)

    // The row has long gone; the form is still on screen, so the mascot stays.
    expect(stickyRect(anchor).top).toBe(72)
  })
})
