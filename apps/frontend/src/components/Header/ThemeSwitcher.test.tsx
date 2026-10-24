import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import i18n from "@/i18n"
import { setTheme } from "@/lib/theme"

import { ThemeSwitcher } from "./ThemeSwitcher"

beforeEach(() => i18n.changeLanguage("en"))
afterEach(() => {
  setTheme("light")
  localStorage.clear()
})

describe("ThemeSwitcher", () => {
  it("toggles between light and dark from the icon button", async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }))

    expect(document.documentElement).toHaveClass("dark")

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }))

    expect(document.documentElement).not.toHaveClass("dark")
  })

  it("marks the active theme in the pills variant", async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher variant="pills" />)

    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "Dark" }))

    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "false")
  })
})
