import type { ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MobileMenu } from "@/components/Header/MobileMenu"

// The menu only needs links to render; a real router is beside the point here.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children?: ReactNode; to: string; className?: string }) => (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  ),
}))

const open = async (ui: React.ReactElement) => {
  render(ui)
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
  return within(screen.getByRole("dialog"))
}

describe("MobileMenu", () => {
  it("lists where to go, with the unread count on the chat", async () => {
    const menu = await open(
      <MobileMenu
        hasNav
        chat={{ unreadCount: 3 }}
      />,
    )

    const nav = within(menu.getByRole("navigation", { name: "Main navigation" }))
    expect(nav.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Proposals",
      "My kvintet",
      "Group chat3 unread messages3",
    ])
    expect(nav.getByText("3 unread messages")).toBeInTheDocument()
  })

  it("omits the chat until the kvintet has one", async () => {
    const menu = await open(<MobileMenu hasNav />)

    expect(menu.queryByRole("link", { name: /Group chat/ })).not.toBeInTheDocument()
  })

  it("shows the chat without a badge when nothing is unread", async () => {
    const menu = await open(
      <MobileMenu
        hasNav
        chat={{ unreadCount: 0 }}
      />,
    )

    expect(menu.getByRole("link", { name: "Group chat" })).toBeInTheDocument()
    expect(menu.queryByText(/unread/)).not.toBeInTheDocument()
  })

  it("keeps an unavailable item visible and explains why", async () => {
    const menu = await open(
      <MobileMenu
        hasNav
        navDisabled={{ "/kvintet/feed": "You are already in a kvintet." }}
      />,
    )

    expect(menu.getByRole("link", { name: "Proposals" })).toHaveAttribute("aria-disabled", "true")
  })

  it("has language, theme and the footer links for everyone", async () => {
    const menu = await open(<MobileMenu />)

    expect(menu.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument()
    expect(menu.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument()
    expect(menu.getByRole("link", { name: "Rules" })).toHaveAttribute("href", "/code-of-conduct")
    expect(menu.getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    )
    expect(menu.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument()
  })

  it("renders what the app puts in the top and bottom slots", async () => {
    const menu = await open(
      <MobileMenu
        top={<p>top slot</p>}
        bottom={<p>bottom slot</p>}
      />,
    )

    expect(menu.getByText("top slot")).toBeInTheDocument()
    expect(menu.getByText("bottom slot")).toBeInTheDocument()
  })
})
