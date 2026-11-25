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

/** A person's role is one slug or several joined by ", "; each becomes its label. */
export function roleLabel(role: string, label: ReturnType<typeof useSlugLabel>) {
  return role
    .split(", ")
    .map((slug) => label("roles", slug))
    .join(", ")
}
