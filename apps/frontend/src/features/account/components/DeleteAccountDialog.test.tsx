import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DeleteAccountDialog } from "./DeleteAccountDialog"

describe("DeleteAccountDialog", () => {
  it("renders title, description and action buttons when open", () => {
    render(
      <DeleteAccountDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={false}
      />,
    )

    expect(screen.getByRole("heading", { name: "Delete account" })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete your account\?/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const handleOpenChange = vi.fn()
    render(
      <DeleteAccountDialog
        isOpen={true}
        onOpenChange={handleOpenChange}
        onConfirm={vi.fn()}
        isDeleting={false}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls onConfirm when confirm button is clicked", async () => {
    const handleConfirm = vi.fn()
    render(
      <DeleteAccountDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={handleConfirm}
        isDeleting={false}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete account" }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it("disables buttons and shows deleting state while deleting", () => {
    render(
      <DeleteAccountDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={true}
      />,
    )

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
  })
})
