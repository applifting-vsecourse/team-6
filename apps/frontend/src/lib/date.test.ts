import i18n from "@/i18n"

import { formatDate, formatLongDate, formatNumber, formatTime } from "./date"

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

  it("writes the time of day without a date", () => {
    expect(formatTime(date)).toMatch(/^\d{1,2}:\d{2}/)
    expect(formatTime(date)).not.toContain("2026")
  })

  it("writes the long date in the active language", async () => {
    expect(formatLongDate("2026-10-20T12:00:00Z")).toBe("Tuesday, October 20, 2026")
    await i18n.changeLanguage("cs")
    expect(formatLongDate("2026-10-20T12:00:00Z")).toBe("úterý 20. října 2026")
  })
})
