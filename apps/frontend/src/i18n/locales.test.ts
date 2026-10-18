import { locales } from "@/i18n"

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
})
