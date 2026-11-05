import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"

import type { Tag } from "@/features/profile/api/profileApi"
import { OnboardingCard } from "@/features/profile/components/OnboardingCard"
import { TagBadge } from "@/features/profile/components/TagBadge"

type TagSelectorProps = {
  title: string
  hint?: string
  selectedTagIds: string[]
  allTags: Tag[]
  defaultSuggestedSlugs?: string[]
  onSelectTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

export function TagSelector({
  title,
  hint,
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

  const suggestedTags = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()

    if (lowerSearch !== "") {
      return allTags.filter((tag) => {
        if (selectedTagIds.includes(tag.id)) return false
        const label = getTagLabel(tag).toLowerCase()
        const hasMatchingLabel = label.includes(lowerSearch)
        const hasMatchingSlug = tag.slug.toLowerCase().includes(lowerSearch)
        return Boolean(hasMatchingLabel || hasMatchingSlug)
      })
    }

    // Default suggestions from defaultSuggestedSlugs, falling back to first available
    const preferred = allTags.filter(
      (tag) => defaultSuggestedSlugs.includes(tag.slug) && !selectedTagIds.includes(tag.id),
    )
    if (preferred.length > 0) return preferred

    return allTags.filter((tag) => !selectedTagIds.includes(tag.id)).slice(0, 6)
  }, [allTags, defaultSuggestedSlugs, getTagLabel, search, selectedTagIds])

  return (
    <OnboardingCard
      title={title}
      hint={hint}
    >
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              label={getTagLabel(tag)}
              variant="selected"
              onAction={() => onRemoveTag(tag.id)}
              actionAriaLabel={t("onboarding.step1.removeTag", { name: getTagLabel(tag) })}
            />
          ))}
        </div>
      )}

      {suggestedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              label={getTagLabel(tag)}
              variant="suggested"
              onAction={() => {
                onSelectTag(tag.id)
                setSearch("")
              }}
              actionAriaLabel={t("onboarding.step1.addTag", { name: getTagLabel(tag) })}
            />
          ))}
        </div>
      )}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault()
        }}
        placeholder={t("onboarding.step1.searchTagsPlaceholder")}
        aria-label={t("onboarding.step1.searchTagsAria", { section: title })}
      />
    </OnboardingCard>
  )
}
