import type { RefObject } from "react"
import { act, renderHook } from "@testing-library/react"

import { useStickToBottom } from "./useStickToBottom"

type Geometry = { scrollHeight: number; scrollTop: number; clientHeight: number }

// jsdom has no layout, so the scroller is a plain object with the three numbers the hook reads.
const render = (element: Geometry, id: number) => {
  const ref = { current: element } as unknown as RefObject<HTMLDivElement>
  return renderHook(({ lastId }) => useStickToBottom(ref, lastId), { initialProps: { lastId: id } })
}

describe("useStickToBottom", () => {
  it("opens at the newest message and follows new ones while the reader is at the bottom", () => {
    const element = { scrollHeight: 1000, scrollTop: 0, clientHeight: 300 }
    const { result, rerender } = render(element, 1)
    expect(element.scrollTop).toBe(1000)

    element.scrollHeight = 1100
    rerender({ lastId: 2 })

    expect(element.scrollTop).toBe(1100)
    expect(result.current.hasNew).toBe(false)
  })

  it("leaves a reader who scrolled up alone and offers a jump instead", () => {
    const element = { scrollHeight: 1000, scrollTop: 0, clientHeight: 300 }
    const { result, rerender } = render(element, 1)

    element.scrollTop = 100
    act(() => result.current.onScroll())
    rerender({ lastId: 2 })

    expect(element.scrollTop).toBe(100)
    expect(result.current.hasNew).toBe(true)

    act(() => result.current.scrollToBottom())

    expect(element.scrollTop).toBe(1000)
    expect(result.current.hasNew).toBe(false)
  })
})
