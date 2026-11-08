import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LeaveKvintetDialog } from "./LeaveKvintetDialog"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

describe("LeaveKvintetDialog", () => {
  it("renders proposal leave dialog when isActiveKvintet is false", () => {
    render(
      <LeaveKvintetDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isLeaving={false}
        isActiveKvintet={false}
        avatarSeed="jana"
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Are you sure you want to leave?" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/You'll leave this kvintet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument()
    expect(document.body.querySelector("[data-slot=avatar]")).toBeInTheDocument()
    expect(screen.queryByText(/The others carry on without you/i)).not.toBeInTheDocument()
  })

  it("renders active kvintet leave dialog with callout notice when isActiveKvintet is true", () => {
    render(
      <LeaveKvintetDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isLeaving={false}
        isActiveKvintet={true}
        avatarSeed="jana"
      />,
    )

    expect(screen.getByRole("heading", { name: "Leave the kvintet?" })).toBeInTheDocument()
    expect(screen.getByText(/Others will see that you left/i)).toBeInTheDocument()
    expect(screen.getByText("The others carry on without you.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Stay" })).toBeInTheDocument()
    const leaveButton = screen.getByRole("button", { name: "Leave kvintet" })
    expect(leaveButton).toBeInTheDocument()
    expect(leaveButton).toHaveClass("bg-destructive")
  })

  it("calls onOpenChange(false) when Stay/Cancel is clicked", async () => {
    const handleOpenChange = vi.fn()
    render(
      <LeaveKvintetDialog
        isOpen={true}
        onOpenChange={handleOpenChange}
        onConfirm={vi.fn()}
        isLeaving={false}
        isActiveKvintet={true}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Stay" }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls onConfirm when destructive leave button is clicked", async () => {
    const handleConfirm = vi.fn()
    render(
      <LeaveKvintetDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={handleConfirm}
        isLeaving={false}
        isActiveKvintet={true}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Leave kvintet" }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it("disables buttons and displays leaving status while isLeaving is true", () => {
    render(
      <LeaveKvintetDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isLeaving={true}
        isActiveKvintet={true}
      />,
    )

    expect(screen.getByRole("button", { name: "Stay" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Leaving…" })).toBeDisabled()
  })
})
