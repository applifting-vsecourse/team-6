import { useId } from "react"
import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useMediaQuery } from "@/lib/useMediaQuery"

import { FREQUENCIES, type Frequency } from "@/features/kvintet/lib/frequencies"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"

// Radix keeps the pressed items as strings; "All" needs a value of its own.
const ALL = "all"

type Option = { value: string; text: string }

type GroupProps = {
  title: string
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
}

/** Desktop: a titled list of checkboxes, as in the left panel of the design. */
function CheckboxGroup({ title, options, selected, onChange }: GroupProps) {
  const id = useId()
  const toggle = (value: string, isChecked: boolean) =>
    onChange(isChecked ? [...selected, value] : selected.filter((item) => item !== value))

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 font-mono text-meta tracking-meta text-muted-foreground uppercase">
        {title}
      </legend>
      {options.map(({ value, text }) => (
        <div
          key={value}
          className="flex items-center gap-2.5"
        >
          <Checkbox
            id={`${id}-${value}`}
            checked={selected.includes(value)}
            onCheckedChange={(isChecked) => toggle(value, isChecked === true)}
            // The design's blue highlight marks a ticked filter; primary stays for actions.
            className="size-4.5 data-[state=checked]:border-highlight data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground"
          />
          <Label
            htmlFor={`${id}-${value}`}
            className="text-compact font-normal"
          >
            {text}
          </Label>
        </div>
      ))}
    </fieldset>
  )
}

/** Mobile: one row of chips that scrolls sideways; "All" clears the row. */
function ChipGroup({ title, options, selected, onChange }: GroupProps) {
  const { t } = useTranslation()
  const value = selected.length ? selected : [ALL]

  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      spacing={2}
      // A group of toggles is not a form field, so it gets a role and its own name.
      role="group"
      aria-label={title}
      value={value}
      onValueChange={(next) => {
        // Pressing "All" while something is picked clears the row; any other chip drops "All".
        const isAllPressed = next.includes(ALL) && !value.includes(ALL)
        onChange(isAllPressed ? [] : next.filter((item) => item !== ALL))
      }}
      // The padding keeps focus rings from being clipped by the scroll area; a phone scrolls it by touch.
      className="-m-1 w-auto [scrollbar-width:none] justify-start overflow-x-auto p-1 [&::-webkit-scrollbar]:hidden"
    >
      {[{ value: ALL, text: t("kvintet.filter.all") }, ...options].map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 rounded-full border-input px-3 font-semibold text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
        >
          {option.text}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

type FeedFiltersProps = {
  categories: { slug: string }[]
  category: string[]
  frequency: Frequency[]
  onCategoryChange: (next: string[]) => void
  onFrequencyChange: (next: Frequency[]) => void
}

export function FeedFilters({
  categories,
  category,
  frequency,
  onCategoryChange,
  onFrequencyChange,
}: FeedFiltersProps) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const isDesktop = useMediaQuery("(min-width: 48rem)")
  const Group = isDesktop ? CheckboxGroup : ChipGroup

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <Group
        title={t("kvintet.filter.topic")}
        options={categories.map(({ slug }) => ({ value: slug, text: label("categories", slug) }))}
        selected={category}
        onChange={onCategoryChange}
      />
      <Group
        title={t("kvintet.filter.frequency")}
        options={FREQUENCIES.map((value) => ({ value, text: t(`kvintet.frequency.${value}`) }))}
        selected={frequency}
        onChange={(next) => onFrequencyChange(next as Frequency[])}
      />
    </div>
  )
}
