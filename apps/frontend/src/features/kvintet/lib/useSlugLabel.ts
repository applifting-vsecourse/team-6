import { useTranslation } from "react-i18next"

type Translate = (key: string, options: { defaultValue: string }) => string

/**
 * Translates a reference-data slug (category, tag); an unknown slug shows as itself.
 * shortcut: the `tags.*` labels in the locale files match the placeholder tag list, so
 * replace them together with the tags when the onboarding story (#7) lands.
 */
export function useSlugLabel() {
  const { t } = useTranslation()
  // The key is built from server data, so it can't go through the typed `t`.
  return (group: "categories" | "tags", slug: string) =>
    (t as unknown as Translate)(`${group}.${slug}`, { defaultValue: slug })
}
