import { useTranslation } from "react-i18next"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

// Radix keeps the pressed item as a string; "All" needs a value of its own.
const ALL = "all"

type CategoryFilterProps = {
  categories: { slug: string }[]
  /** Selected category slug, or undefined for "All". */
  value: string | undefined
  onChange: (slug: string | undefined) => void
}

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      aria-label={t("kvintet.filter.label")}
      value={value ?? ALL}
      // Pressing the selected chip again reports "" — keep the selection instead.
      onValueChange={(next) => {
        if (next) onChange(next === ALL ? undefined : next)
      }}
      // One row that scrolls sideways on a phone; the padding keeps focus rings from being clipped.
      className="-m-1 w-auto justify-start overflow-x-auto p-1"
    >
      {[
        { slug: ALL, text: t("kvintet.filter.all") },
        ...categories.map(({ slug }) => ({ slug, text: label("categories", slug) })),
      ].map(({ slug, text }) => (
        <ToggleGroupItem
          key={slug}
          value={slug}
          className="h-8 rounded-full border-input px-3 font-semibold text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          {text}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
