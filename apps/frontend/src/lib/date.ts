import i18n from "@/i18n"

// Format through the active locale. Components should call `useTranslation()` so
// they re-render when the language changes.
export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

// "Tuesday, 20 October 2026" / "úterý 20. října 2026"
export function formatLongDate(date: string | number | Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "full" }).format(
    new Date(date),
  )
}

// "6:02 PM" / "18:02"
export function formatTime(date: string | number | Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage, { timeStyle: "short" }).format(
    new Date(date),
  )
}

// "Python, SQL and Excel" / "Python, SQL a Excel"
export function formatList(items: string[]) {
  return new Intl.ListFormat(i18n.resolvedLanguage, { style: "long", type: "conjunction" }).format(
    items,
  )
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(i18n.resolvedLanguage, options).format(value)
}
