import { useTranslation } from "react-i18next"

import { useSlugLabel } from "@/lib/useSlugLabel"

import type { ReferenceTag } from "@/features/profile/api/profileApi"
import { CategoryPicker } from "@/features/profile/components/CategoryPicker"

type TagSelectorProps = {
  title: string
  hint?: string
  selectedTagIds: string[]
  allTags: ReferenceTag[]
  categories: { slug: string }[]
  onSelectTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

export function TagSelector({
  title,
  hint,
  selectedTagIds,
  allTags,
  categories,
  onSelectTag,
  onRemoveTag,
}: TagSelectorProps) {
  const { t } = useTranslation()
  const slugLabel = useSlugLabel()

  return (
    <CategoryPicker
      title={title}
      hint={hint}
      groups={categories.map(({ slug }) => ({ id: slug, label: slugLabel("categories", slug) }))}
      items={allTags.map((tag) => ({
        id: tag.id,
        label: slugLabel("tags", tag.slug),
        groupIds: tag.categories,
      }))}
      selectedIds={selectedTagIds}
      onSelect={onSelectTag}
      onRemove={onRemoveTag}
      addLabel={(name) => t("onboarding.step1.addTag", { name })}
      removeLabel={(name) => t("onboarding.step1.removeTag", { name })}
      searchLinkLabel={t("onboarding.step1.searchAllTags")}
      searchPlaceholder={t("onboarding.step1.searchTagsPlaceholder")}
      searchAriaLabel={t("onboarding.step1.searchTagsAria", { section: title })}
    />
  )
}
