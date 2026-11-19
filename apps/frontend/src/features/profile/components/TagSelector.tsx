import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"

import type { Tag } from "@/features/profile/api/profileApi"
import { TagBadge } from "@/features/profile/components/TagBadge"
import { softFieldClass } from "@/features/profile/lib/optionStyles"

type TagSelectorProps = {
  selectedTagIds: string[]
  allTags: Tag[]
  defaultSuggestedSlugs?: string[]
  onSelectTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

// Figma B1b shows three suggestions; picking one brings the next one in.
const SUGGESTION_COUNT = 3
const SEARCH_RESULT_COUNT = 8

/**
 * Chosen topics as chips, a search over our topics, and a few suggestions (Figma B1b). Topics
 * are ours: the search finds them, it cannot create new ones.
 */
export function TagSelector({
  selectedTagIds,
  allTags,
  defaultSuggestedSlugs = [],
  onSelectTag,
  onRemoveTag,
}: TagSelectorProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  const getTagLabel = useCallback(
    (tag: Tag): string => {
      const key = `tags.${tag.slug}`
      const translated = (t as (k: string) => string)(key)
      return translated === key ? tag.slug : translated
    },
    [t],
  )

  const selectedTags = useMemo(
    () => allTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [allTags, selectedTagIds],
  )

  const query = search.trim().toLowerCase()
  const unselected = useMemo(
    () => allTags.filter((tag) => !selectedTagIds.includes(tag.id)),
    [allTags, selectedTagIds],
  )

  const shown = useMemo(() => {
    if (query !== "") {
      return unselected
        .filter(
          (tag) =>
            getTagLabel(tag).toLowerCase().includes(query) ||
            tag.slug.toLowerCase().includes(query),
        )
        .slice(0, SEARCH_RESULT_COUNT)
    }
    const preferred = unselected.filter((tag) => defaultSuggestedSlugs.includes(tag.slug))
    return [...preferred, ...unselected.filter((tag) => !preferred.includes(tag))].slice(
      0,
      SUGGESTION_COUNT,
    )
  }, [unselected, query, defaultSuggestedSlugs, getTagLabel])

  return (
    <div className="flex flex-col gap-3.5">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              label={getTagLabel(tag)}
              variant="selected"
              onAction={() => onRemoveTag(tag.id)}
              actionAriaLabel={t("onboarding.tags.removeTag", { name: getTagLabel(tag) })}
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

      {query === "" ? (
        <p className="text-label text-muted-foreground uppercase">
          {t("onboarding.tags.suggested")}
        </p>
      ) : null}

      {shown.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {shown.map((tag) => (
            <TagBadge
              key={tag.id}
              label={getTagLabel(tag)}
              variant="suggested"
              onAction={() => {
                onSelectTag(tag.id)
                setSearch("")
              }}
              actionAriaLabel={t("onboarding.tags.addTag", { name: getTagLabel(tag) })}
            />
          ))}
        </div>
      ) : query !== "" ? (
        <p className="text-small text-muted-foreground">{t("onboarding.tags.none")}</p>
      ) : null}
    </div>
  )
}
