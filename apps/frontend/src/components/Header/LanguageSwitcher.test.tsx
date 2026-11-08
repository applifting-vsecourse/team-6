import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import i18n from "@/i18n"

import { LanguageSwitcher } from "./LanguageSwitcher"

afterEach(() => i18n.changeLanguage("en"))

describe("LanguageSwitcher", () => {
  it("switches the language and the <html lang> attribute", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "Čeština" }))

    expect(i18n.resolvedLanguage).toBe("cs")
    expect(document.documentElement.lang).toBe("cs")
    expect(screen.getByRole("group", { name: "Jazyk" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Čeština" })).toHaveAttribute("aria-pressed", "true")
  })

  it("is a segmented switch in the mobile menu and always keeps one language", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher variant="pills" />)

    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked()

    await user.click(screen.getByRole("radio", { name: "Čeština" }))

    expect(i18n.resolvedLanguage).toBe("cs")

    await user.click(screen.getByRole("radio", { name: "Čeština" }))

    expect(i18n.resolvedLanguage).toBe("cs")
  })
})
