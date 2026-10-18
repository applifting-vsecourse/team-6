import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import i18n from "@/i18n"

import { LanguageSwitcher } from "./LanguageSwitcher"

afterEach(() => i18n.changeLanguage("en"))

describe("LanguageSwitcher", () => {
  it("switches the language and the <html lang> attribute", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button", { name: "Language" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "Čeština" }))

    expect(i18n.resolvedLanguage).toBe("cs")
    expect(document.documentElement.lang).toBe("cs")
    expect(screen.getByRole("button", { name: "Jazyk" })).toBeInTheDocument()
  })
})
