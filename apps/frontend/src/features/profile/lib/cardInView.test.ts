import { cardInView } from "./cardInView"

const cards = [
  { id: "a", top: 100, bottom: 300 },
  { id: "b", top: 324, bottom: 500 },
  { id: "c", top: 524, bottom: 1400 },
]

describe("cardInView", () => {
  it("picks the card the middle of the window falls on", () => {
    expect(cardInView(cards, 800)).toBe("b") // middle at 400
    expect(cardInView(cards, 300)).toBe("a") // middle at 150
  })

  it("picks the tall card for as long as it covers the middle", () => {
    expect(cardInView(cards, 1400)).toBe("c")
  })

  it("takes the nearest card when the middle falls in a gap", () => {
    expect(cardInView(cards, 640)).toBe("b") // middle at 320, 20 from a, 4 from b
    expect(cardInView(cards, 1040)).toBe("c") // middle at 520, 20 from b, 4 from c
  })

  it("takes the nearest card when everything is above or below the middle", () => {
    expect(
      cardInView(
        cards.map((card) => ({ ...card, top: card.top - 2000, bottom: card.bottom - 2000 })),
        800,
      ),
    ).toBe("c")
  })

  it("has no answer without cards", () => {
    expect(cardInView([], 800)).toBeUndefined()
  })
})
