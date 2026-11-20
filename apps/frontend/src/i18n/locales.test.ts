import i18n, { locales } from "@/i18n"

// "passwordMin_few" and "passwordMin_other" are plural forms of one key, and
// languages need different forms, so compare keys without the plural suffix.
const keysOf = (obj: object, prefix = ""): string[] =>
  Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keysOf(value, `${prefix}${key}.`)
      : [`${prefix}${key.replace(/_(zero|one|two|few|many|other)$/, "")}`],
  )

const uniqueKeys = (translation: object) => [...new Set(keysOf(translation))].sort()

describe("locale files", () => {
  const [reference, ...others] = locales

  it.each(others.map((locale) => [locale.code, locale] as const))(
    "%s has exactly the keys of English",
    (_code, locale) => {
      expect(uniqueKeys(locale.translation)).toEqual(uniqueKeys(reference.translation))
    },
  )

  it("declines the member count of an active kvintet in Czech", () => {
    const subtitle = (count: number) =>
      (i18n.t as (key: string, options: object) => string)("overview.active.subtitle", {
        lng: "cs",
        title: "T",
        date: "d",
        count,
      })

    expect(subtitle(1)).toBe("T · 1 člověk · od d")
    expect(subtitle(3)).toBe("T · 3 lidé · od d")
    expect(subtitle(5)).toBe("T · 5 lidí · od d")
  })
})
