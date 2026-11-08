import { useTranslation } from "react-i18next"

type Translate = (key: string, options: { defaultValue: string }) => string

/**
 * Translates a reference-data slug (category, tag, role); an unknown slug shows as itself.
 */
export function useSlugLabel() {
  const { t } = useTranslation()
  // The key is built from server data, so it can't go through the typed `t`.
  return (group: "categories" | "tags" | "roles", slug: string) =>
    (t as unknown as Translate)(`${group}.${slug}`, { defaultValue: slug })
}
