import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { useSlugLabel } from "@/lib/useSlugLabel"

import type { ReferenceTag } from "@/features/profile/api/profileApi"
import { TagBadge } from "@/features/profile/components/TagBadge"
import { chipClass, softFieldClass } from "@/features/profile/lib/optionStyles"

type TagSelectorProps = {
  selectedTagIds: string[]
  allTags: ReferenceTag[]
  categories: { slug: string }[]
  onSelectTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

const SEARCH_RESULT_COUNT = 12

/**
 * Chosen topics as chips, a search over all of them, and the categories to browse (Figma B1b,
 * with the categories of #122: pick one and its topics come up as chips). A topic with no category
 * is found by the search. Topics are ours: the search finds them, it cannot create new ones.
 */
export function TagSelector({
  selectedTagIds,
  allTags,
  categories,
  onSelectTag,
  onRemoveTag,
}: TagSelectorProps) {
  const { t } = useTranslation()
  const slugLabel = useSlugLabel()
  const [search, setSearch] = useState("")
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined)

  const labelOf = (tag: ReferenceTag) => slugLabel("tags", tag.slug)
  const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))
  const unselected = allTags.filter((tag) => !selectedTagIds.includes(tag.id))

  // The search looks at the label and the slug; a tag's id is a number and would match by chance.
  const query = search.trim().toLowerCase()
  const found =
    query === ""
      ? []
      : unselected
          .filter(
            (tag) =>
              labelOf(tag).toLowerCase().includes(query) || tag.slug.toLowerCase().includes(query),
          )
          .slice(0, SEARCH_RESULT_COUNT)
  const ofCategory = categorySlug
    ? unselected.filter((tag) => tag.categories.includes(categorySlug))
    : []

  const add = (tag: ReferenceTag) => (
    <TagBadge
      key={tag.id}
      label={labelOf(tag)}
      variant="suggested"
      onAction={() => {
        onSelectTag(tag.id)
        setSearch("")
      }}
      actionAriaLabel={t("onboarding.tags.addTag", { name: labelOf(tag) })}
    />
  )

  return (
    <div className="flex flex-col gap-3.5">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              label={labelOf(tag)}
              variant="selected"
              onAction={() => onRemoveTag(tag.id)}
              actionAriaLabel={t("onboarding.tags.removeTag", { name: labelOf(tag) })}
            />
          ))}
        </div>
      )}

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          // Enter in the search must not continue to the next page.
          if (event.key === "Enter") event.preventDefault()
        }}
        placeholder={t("onboarding.tags.searchPlaceholder")}
        aria-label={t("onboarding.tags.searchAria")}
        className={`h-12.75 ${softFieldClass}`}
      />

      {query !== "" ? (
        found.length > 0 ? (
          <div className="flex flex-wrap gap-2">{found.map(add)}</div>
        ) : (
          <p className="text-small text-muted-foreground">{t("onboarding.tags.none")}</p>
        )
      ) : (
        <>
          <p className="text-label text-muted-foreground">{t("onboarding.tags.categoryLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ slug }) => (
              <button
                key={slug}
                type="button"
                aria-pressed={slug === categorySlug}
                onClick={() => setCategorySlug(slug)}
                className={chipClass(slug === categorySlug)}
              >
                {slugLabel("categories", slug)}
              </button>
            ))}
          </div>
          {ofCategory.length > 0 ? (
            <div className="flex flex-wrap gap-2">{ofCategory.map(add)}</div>
          ) : null}
        </>
      )}
    </div>
  )
}
