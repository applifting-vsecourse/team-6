import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { NotFound } from "@/components/Error/NotFound"
import { RootErrorBoundary } from "@/components/Error/RootErrorBoundary"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

describe("NotFound", () => {
  it("keeps the app header and offers a way home", () => {
    render(<NotFound header={<header>app header</header>} />)

    expect(screen.getByText("app header")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "This page doesn't exist" })).toBeInTheDocument()
    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/")
  })
})

describe("RootErrorBoundary", () => {
  it("says something went wrong and offers a reload, with no app chrome", () => {
    render(<RootErrorBoundary error={new Error("boom")} />)

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
  })
})
