import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

const stubMobile = (isMobile: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: isMobile,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )

const renderSheet = () => {
  const onOpenChange = vi.fn()
  render(
    <Dialog
      open
      onOpenChange={onOpenChange}
    >
      <DialogContent isBottomSheet>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
        <input aria-label="Name" />
      </DialogContent>
    </Dialog>,
  )
  return { onOpenChange, sheet: screen.getByRole("dialog") }
}

// react-remove-scroll (inside Radix) reads changedTouches on every touch event.
const touch = (clientY: number) => {
  const point = { clientX: 0, clientY }
  return { touches: [point], changedTouches: [point] }
}
const touchesEnd = (clientY: number) => ({
  touches: [],
  changedTouches: [{ clientX: 0, clientY }],
})

const drag = (target: Element, from: number, to: number) => {
  fireEvent.touchStart(target, touch(from))
  fireEvent.touchMove(target, touch(to))
  fireEvent.touchEnd(target, touchesEnd(to))
}

describe("DialogContent isBottomSheet", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("closes when dragged down past the threshold", () => {
    stubMobile(true)
    const { onOpenChange, sheet } = renderSheet()

    drag(sheet, 100, 250)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("follows the finger, then snaps back after a short drag", () => {
    stubMobile(true)
    const { onOpenChange, sheet } = renderSheet()

    fireEvent.touchStart(sheet, touch(100))
    fireEvent.touchMove(sheet, touch(130))
    expect(sheet.style.transform).toBe("translateY(30px)")

    fireEvent.touchEnd(sheet, touchesEnd(130))
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })

  it("does not start a drag from a form control", () => {
    stubMobile(true)
    const { onOpenChange } = renderSheet()

    drag(screen.getByLabelText("Name"), 100, 250)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("ignores upward drags", () => {
    stubMobile(true)
    const { sheet } = renderSheet()

    fireEvent.touchStart(sheet, touch(200))
    fireEvent.touchMove(sheet, touch(50))

    expect(sheet.style.transform).toBe("translateY(0px)")
  })

  it("does nothing on desktop", () => {
    stubMobile(false)
    const { onOpenChange, sheet } = renderSheet()

    drag(sheet, 100, 250)

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })
})
