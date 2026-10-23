import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Step1Profile } from "./Step1Profile"

const mockTags = [
  { id: "1", slug: "excel" },
  { id: "2", slug: "python" },
  { id: "3", slug: "hiking" },
]

describe("Step1Profile", () => {
  it("renders role field and requires it before continuing", async () => {
    const onContinue = vi.fn()
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    render(
      <Step1Profile
        initialData={{
          position: "",
          teachTagIds: [],
          learnTagIds: [],
          interestTagIds: [],
        }}
        allTags={mockTags}
        onContinue={onContinue}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText("Select at least one role")).toBeInTheDocument()
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })

  it("submits position and selected tags", async () => {
    const onContinue = vi.fn()
    render(
      <Step1Profile
        initialData={{
          roles: [],
          position: "",
          teachTagIds: [],
          learnTagIds: [],
          interestTagIds: [],
        }}
        allTags={mockTags}
        onContinue={onContinue}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Select role Marketing Specialist" }))
    await userEvent.click(screen.getByRole("button", { name: "Add tag Excel" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onContinue).toHaveBeenCalledWith({
      roles: ["marketing-specialist"],
      position: "marketing-specialist",
      teachTagIds: ["1"],
      learnTagIds: [],
      interestTagIds: [],
    })
  })

  it("supports selecting multiple roles", async () => {
    const onContinue = vi.fn()
    render(
      <Step1Profile
        initialData={{
          roles: [],
          position: "",
          teachTagIds: [],
          learnTagIds: [],
          interestTagIds: [],
        }}
        allTags={mockTags}
        onContinue={onContinue}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Select role Software Engineer" }))
    await userEvent.click(screen.getByRole("button", { name: "Select role Frontend Developer" }))
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onContinue).toHaveBeenCalledWith({
      roles: ["software-engineer", "frontend-developer"],
      position: "software-engineer",
      teachTagIds: [],
      learnTagIds: [],
      interestTagIds: [],
    })
  })
})
