import i18n from "@/i18n"

// Format through the active locale. Components should call `useTranslation()` so
// they re-render when the language changes.
export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(i18n.resolvedLanguage, options).format(value)
}
