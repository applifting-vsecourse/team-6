import i18n from "@/i18n"

import { formatDate, formatNumber } from "./date"

afterEach(() => i18n.changeLanguage("en"))

describe("locale formatting", () => {
  const date = "2026-10-18T14:05:00Z"

  it("formats dates and numbers with the active language", async () => {
    const english = { date: formatDate(date), number: formatNumber(1234.5) }
    await i18n.changeLanguage("cs")
    const czech = { date: formatDate(date), number: formatNumber(1234.5) }

    expect(english.number).toBe("1,234.5")
    expect(czech.number).toBe("1 234,5")
    expect(czech.date).not.toBe(english.date)
    expect(czech.date).toContain("2026")
  })
})
