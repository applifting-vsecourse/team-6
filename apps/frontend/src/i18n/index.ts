import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import cs from "./locales/cs.json"
import en from "./locales/en.json"

// Adding a language: drop `<code>.json` into ./locales and add one line here.
export const locales = [
  { code: "cs", nativeName: "Čeština", translation: cs },
  { code: "en", nativeName: "English", translation: en },
] as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(locales.map((l) => [l.code, { translation: l.translation }])),
    supportedLngs: locales.map((l) => l.code),
    // "en-US" / "cs-CZ" resolve to the base language
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
    interpolation: { escapeValue: false },
  })

const syncHtmlLang = () => {
  document.documentElement.lang = i18n.resolvedLanguage ?? "en"
}
i18n.on("languageChanged", syncHtmlLang)
syncHtmlLang()

export default i18n
