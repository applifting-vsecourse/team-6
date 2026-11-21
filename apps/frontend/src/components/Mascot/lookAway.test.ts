import { lookAwayFromPointer, setPointerForTest } from "./lookAway"

type Target = { x: number; y: number }
// A mascot centred at (724, 324).
const look = () => lookAwayFromPointer(700, 300, 48, 48) as Target

afterEach(() => setPointerForTest(null))

describe("lookAwayFromPointer", () => {
  it("looks to the right when the pointer is to the left of the mascot", () => {
    setPointerForTest({ x: 200, y: 324 })

    expect(look().x).toBeGreaterThan(724)
    expect(look().y).toBeCloseTo(324)
  })

  it("looks up when the pointer is below the mascot", () => {
    setPointerForTest({ x: 724, y: 700 })

    expect(look().y).toBeLessThan(324)
    expect(look().x).toBeCloseTo(724)
  })

  it("looks to the left when the pointer is to the right", () => {
    setPointerForTest({ x: 1200, y: 324 })

    expect(look().x).toBeLessThan(724)
  })

  it("looks up and to the left when it does not know where the pointer is", () => {
    expect(look().x).toBeLessThan(724)
    expect(look().y).toBeLessThan(324)
  })

  it("does the same when the pointer is right on the mascot", () => {
    setPointerForTest({ x: 724, y: 324 })

    expect(look().x).toBeLessThan(724)
    expect(look().y).toBeLessThan(324)
  })
})
