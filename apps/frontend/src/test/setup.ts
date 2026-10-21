import "@testing-library/jest-dom/vitest"

import i18n from "@/i18n"

// Tests assert on English text regardless of the machine's locale.
await i18n.changeLanguage("en")
