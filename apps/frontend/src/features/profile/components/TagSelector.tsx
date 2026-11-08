import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

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

// Figma B1 shows three suggestions per card; picking one brings the next one in.
const SUGGESTION_COUNT = 3

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
    const unselected = allTags.filter((tag) => !selectedTagIds.includes(tag.id))
    const preferred = unselected.filter((tag) => defaultSuggestedSlugs.includes(tag.slug))
    return [...preferred, ...unselected.filter((tag) => !preferred.includes(tag))].slice(
      0,
      SUGGESTION_COUNT,
    )
  }, [allTags, defaultSuggestedSlugs, selectedTagIds])

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
              onAction={() => onSelectTag(tag.id)}
              actionAriaLabel={t("onboarding.step1.addTag", { name: getTagLabel(tag) })}
            />
          ))}
        </div>
      )}
    </OnboardingCard>
  )
}
