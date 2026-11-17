import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { OnboardingCard } from "@/features/profile/components/OnboardingCard"
import { TagBadge } from "@/features/profile/components/TagBadge"

export type PickerGroup = { id: string; label: string }
// An item may sit in several groups; one in none is still found by the search.
export type PickerItem = { id: string; label: string; groupIds: readonly string[] }

type CategoryPickerProps = {
  title: string
  hint?: string
  groups: PickerGroup[]
  items: PickerItem[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  addLabel: (name: string) => string
  removeLabel: (name: string) => string
  searchLinkLabel: string
  searchPlaceholder: string
  searchAriaLabel: string
  error?: string | null
}

/**
 * Pick several items: choose a group, toggle its items, or open "search all" for the rest.
 * Shared by the role and the tag cards of onboarding step 1.
 */
export function CategoryPicker({
  title,
  hint,
  groups,
  items,
  selectedIds,
  onSelect,
  onRemove,
  addLabel,
  removeLabel,
  searchLinkLabel,
  searchPlaceholder,
  searchAriaLabel,
  error,
}: CategoryPickerProps) {
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  // Opens on the group of the first chosen item, otherwise on none until a group is picked.
  const [groupId, setGroupId] = useState<string | undefined>(
    () => items.find((item) => item.id === selectedIds[0])?.groupIds[0],
  )

  const labelOf = (id: string) => items.find((item) => item.id === id)?.label ?? id
  const group = groups.find((item) => item.id === groupId)
  const groupItems = group ? items.filter((item) => item.groupIds.includes(group.id)) : []

  // Chosen items that the open group does not show, so none of them is ever hidden.
  const otherSelectedIds = selectedIds.filter((id) => !groupItems.some((item) => item.id === id))

  const query = search.trim().toLowerCase()
  // Nothing until the person types, so opening the search does not dump every item.
  const searchResults =
    query === ""
      ? []
      : items.filter(
          (item) =>
            !selectedIds.includes(item.id) &&
            (item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)),
        )

  return (
    <OnboardingCard
      title={title}
      hint={hint}
      isInvalid={Boolean(error)}
      className="gap-3.5"
    >
      <div className="flex flex-wrap gap-2">
        {groups.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === groupId ? "default" : "outline"}
            aria-pressed={item.id === groupId}
            onClick={() => setGroupId(item.id)}
            className={cn("h-auto px-3 py-2.5", item.id !== groupId && "bg-card")}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {(group !== undefined || otherSelectedIds.length > 0 || isSearching) && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
          {group && (
            <>
              <p className="font-mono text-meta tracking-meta text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {groupItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      aria-pressed={isSelected}
                      aria-label={isSelected ? removeLabel(item.label) : addLabel(item.label)}
                      onClick={() => (isSelected ? onRemove(item.id) : onSelect(item.id))}
                      className={cn(
                        "h-auto gap-1 rounded-full px-3 py-1.5 text-small font-normal",
                        isSelected
                          ? "border-highlight bg-highlight-soft text-highlight hover:bg-highlight-soft hover:text-highlight"
                          : "bg-card",
                      )}
                    >
                      {isSelected ? <Check className="size-3 stroke-[2.5]" /> : null}
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </>
          )}

          {otherSelectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {otherSelectedIds.map((id) => (
                <TagBadge
                  key={id}
                  label={labelOf(id)}
                  variant="selected"
                  onAction={() => onRemove(id)}
                  actionAriaLabel={removeLabel(labelOf(id))}
                />
              ))}
            </div>
          )}

          {isSearching ? (
            <>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault()
                }}
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel}
              />
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((item) => (
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
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {!isSearching && (
        <Button
          type="button"
          variant="link"
          onClick={() => setIsSearching(true)}
          className="h-auto w-fit p-0 text-small font-normal text-highlight underline"
        >
          {searchLinkLabel}
        </Button>
      )}

      {error && (
        <p
          role="alert"
          className="text-small text-destructive"
        >
          {error}
        </p>
      )}
    </OnboardingCard>
  )
}
