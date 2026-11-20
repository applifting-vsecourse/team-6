import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MascotBubble, type BubbleLayout } from "./MascotBubble"

const layout: BubbleLayout = {
  side: "left",
  width: 200,
  maxWidth: 280,
  left: 100,
  top: 100,
  tailX: 0,
  tailY: 28,
}

describe("MascotBubble", () => {
  it("closes with a cross in the corner", async () => {
    const onClose = vi.fn()
    render(
      <MascotBubble
        bubble={{ text: "Hello" }}
        layout={layout}
        isVisible
        onClose={onClose}
        onMeasure={() => undefined}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it("has no cross unless the page asks for one", () => {
    render(
      <MascotBubble
        bubble={{ text: "Hello" }}
        layout={layout}
        isVisible
        onMeasure={() => undefined}
      />,
    )

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("keeps its action buttons next to the text", async () => {
    const onClick = vi.fn()
    render(
      <MascotBubble
        bubble={{ text: "Hello", actions: [{ label: "Next", onClick }] }}
        layout={layout}
        isVisible
        onMeasure={() => undefined}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
