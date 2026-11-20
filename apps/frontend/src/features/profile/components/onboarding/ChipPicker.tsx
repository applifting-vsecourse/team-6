import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import { TagBadge } from "@/features/profile/components/TagBadge"
import { chipClass, softFieldClass } from "@/features/profile/lib/optionStyles"

export type PickerGroup = { id: string; label: string }
// An item may sit in several groups; one in none is still found by the search.
// `slug` is searched next to the label; `id` is not, as a tag id is a number.
export type PickerItem = { id: string; slug: string; label: string; groupIds: readonly string[] }

type ChipPickerProps = {
  groups: PickerGroup[]
  /** The word above the group chips ("Field", "Category"). */
  groupLabel: string
  items: PickerItem[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  addLabel: (name: string) => string
  removeLabel: (name: string) => string
  searchPlaceholder: string
  searchAriaLabel: string
  noneLabel: string
}

const SEARCH_RESULT_COUNT = 12

/**
 * Pick any number of items (Figma B1 to B1d): the groups to browse on top, then a search over all
 * of them, and under it the chosen ones as chips and the items of the open group. The same for roles and topics.
 */
export function ChipPicker({
  groups,
  groupLabel,
  items,
  selectedIds,
  onSelect,
  onRemove,
  addLabel,
  removeLabel,
  searchPlaceholder,
  searchAriaLabel,
  noneLabel,
}: ChipPickerProps) {
  const [search, setSearch] = useState("")
  // Opens on the group of the first chosen item, otherwise on none until a group is picked.
  const [groupId, setGroupId] = useState<string | undefined>(
    () => items.find((item) => item.id === selectedIds[0])?.groupIds[0],
  )

  const selected = items.filter((item) => selectedIds.includes(item.id))
  const unselected = items.filter((item) => !selectedIds.includes(item.id))

  const query = search.trim().toLowerCase()
  const found =
    query === ""
      ? []
      : unselected
          .filter(
            (item) =>
              item.label.toLowerCase().includes(query) || item.slug.toLowerCase().includes(query),
          )
          .slice(0, SEARCH_RESULT_COUNT)
  const ofGroup = groupId ? unselected.filter((item) => item.groupIds.includes(groupId)) : []

  const add = (item: PickerItem) => (
    <TagBadge
      key={item.id}
      label={item.label}
      variant="suggested"
      onAction={() => {
        onSelect(item.id)
        setSearch("")
      }}
      actionAriaLabel={addLabel(item.label)}
    />
  )

  return (
    <div className="flex flex-col gap-3 md:gap-3.5">
      {/* The groups come first, as the guide's question says: the field, then what is in it. */}
      <p className="text-label text-muted-foreground">{groupLabel}</p>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={group.id === groupId}
            onClick={() => setGroupId(group.id)}
            className={chipClass(group.id === groupId)}
          >
            {group.label}
          </button>
        ))}
      </div>
      {/* What the open group holds is told apart from the groups above it. */}
      {ofGroup.length > 0 ? <Separator /> : null}

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          // Enter in the search must not continue to the next page.
          if (event.key === "Enter") event.preventDefault()
        }}
        placeholder={searchPlaceholder}
        aria-label={searchAriaLabel}
        className={`h-12.75 ${softFieldClass}`}
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <TagBadge
              key={item.id}
              label={item.label}
              variant="selected"
              onAction={() => onRemove(item.id)}
              actionAriaLabel={removeLabel(item.label)}
            />
          ))}
        </div>
      )}

      {query !== "" ? (
        found.length > 0 ? (
          <div className="flex flex-wrap gap-2">{found.map(add)}</div>
        ) : (
          <p className="text-small text-muted-foreground">{noneLabel}</p>
        )
      ) : ofGroup.length > 0 ? (
        <div className="flex flex-wrap gap-2">{ofGroup.map(add)}</div>
      ) : null}
    </div>
  )
}
