import { useTranslation } from "react-i18next"

import { useSlugLabel } from "@/lib/useSlugLabel"

import type { ReferenceTag } from "@/features/profile/api/profileApi"
import { ChipPicker } from "@/features/profile/components/onboarding/ChipPicker"

type TagSelectorProps = {
  selectedTagIds: string[]
  allTags: ReferenceTag[]
  categories: { slug: string }[]
  onSelectTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

/**
 * Topics (Figma B1b to B1d, with the categories of #122). Topics are ours: the search finds them,
 * it cannot create new ones.
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

  return (
    <ChipPicker
      groups={categories.map(({ slug }) => ({ id: slug, label: slugLabel("categories", slug) }))}
      groupLabel={t("onboarding.tags.categoryLabel")}
      items={allTags.map((tag) => ({
        id: tag.id,
        label: slugLabel("tags", tag.slug),
        groupIds: tag.categories,
      }))}
      selectedIds={selectedTagIds}
      onSelect={onSelectTag}
      onRemove={onRemoveTag}
      addLabel={(name) => t("onboarding.tags.addTag", { name })}
      removeLabel={(name) => t("onboarding.tags.removeTag", { name })}
      searchPlaceholder={t("onboarding.tags.searchPlaceholder")}
      searchAriaLabel={t("onboarding.tags.searchAria")}
      noneLabel={t("onboarding.tags.none")}
    />
  )
}
