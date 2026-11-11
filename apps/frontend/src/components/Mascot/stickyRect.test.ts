import { STICKY_ATTRIBUTE, stickyRect } from "./stickyRect"

const place = (element: HTMLElement, top: number, height: number, left = 100, width = 56) => {
  element.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect
}

function build(options: { anchorTop: number; cardBottom: number; isSticky?: boolean }) {
  const card = document.createElement("section")
  const anchor = document.createElement("span")
  if (options.isSticky !== false) anchor.setAttribute(STICKY_ATTRIBUTE, "")
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

  it("keeps its column and size", () => {
    const rect = stickyRect(build({ anchorTop: -400, cardBottom: 900 }))

    expect([rect.left, rect.right, rect.width, rect.height]).toEqual([100, 156, 56, 56])
  })

  it("takes an anchor without the mark as it is", () => {
    const anchor = build({ anchorTop: -400, cardBottom: 900, isSticky: false })

    expect(stickyRect(anchor).top).toBe(-400)
  })
})
