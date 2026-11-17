import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

  it("snaps back when the dialog refuses to close", async () => {
    stubMobile(true)
    // The mock never flips `open`, like Delete account while the delete is in flight.
    const { onOpenChange, sheet } = renderSheet()

    drag(sheet, 100, 250)

    expect(onOpenChange).toHaveBeenCalledWith(false)
    await waitFor(() => expect(sheet.style.transform).toBe(""))
  })

  it("closes an uncontrolled dialog", async () => {
    stubMobile(true)
    render(
      <Dialog defaultOpen>
        <DialogContent isBottomSheet>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>,
    )

    drag(screen.getByRole("dialog"), 100, 250)

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("snaps back when the browser cancels the touch", () => {
    stubMobile(true)
    const { onOpenChange, sheet } = renderSheet()

    fireEvent.touchStart(sheet, touch(100))
    fireEvent.touchMove(sheet, touch(250))
    fireEvent.touchCancel(sheet, touchesEnd(250))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })

  it("ignores multi-touch", () => {
    stubMobile(true)
    const { onOpenChange, sheet } = renderSheet()
    const point = { clientX: 0, clientY: 100 }

    fireEvent.touchStart(sheet, { touches: [point, point], changedTouches: [point] })
    fireEvent.touchMove(sheet, touch(250))
    fireEvent.touchEnd(sheet, touchesEnd(250))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })

  it("does not dismiss while the sheet is scrolled", () => {
    stubMobile(true)
    const { onOpenChange, sheet } = renderSheet()
    sheet.scrollTop = 40

    drag(sheet, 100, 250)

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })

  it("does nothing on desktop", () => {
    stubMobile(false)
    const { onOpenChange, sheet } = renderSheet()

    drag(sheet, 100, 250)

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(sheet.style.transform).toBe("")
  })
})
