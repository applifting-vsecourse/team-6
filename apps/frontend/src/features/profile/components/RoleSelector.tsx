import { useCallback, useMemo, useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HoverGazeBlobatar } from "@/components/HoverGazeBlobatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { OnboardingCard } from "@/features/profile/components/OnboardingCard"
import { TagBadge } from "@/features/profile/components/TagBadge"
import { fieldOfRole, ROLE_FIELDS, type RoleFieldId } from "@/features/profile/lib/roleFields"

export const PREDEFINED_ROLES = [
  { id: "software-engineer", slug: "software-engineer" },
  { id: "frontend-developer", slug: "frontend-developer" },
  { id: "backend-developer", slug: "backend-developer" },
  { id: "fullstack-developer", slug: "fullstack-developer" },
  { id: "mobile-developer", slug: "mobile-developer" },
  { id: "devops-engineer", slug: "devops-engineer" },
  { id: "cloud-architect", slug: "cloud-architect" },
  { id: "solution-architect", slug: "solution-architect" },
  { id: "software-architect", slug: "software-architect" },
  { id: "qa-engineer", slug: "qa-engineer" },
  { id: "data-engineer", slug: "data-engineer" },
  { id: "data-scientist", slug: "data-scientist" },
  { id: "data-analyst", slug: "data-analyst" },
  { id: "machine-learning-engineer", slug: "machine-learning-engineer" },
  { id: "ai-engineer", slug: "ai-engineer" },
  { id: "security-engineer", slug: "security-engineer" },
  { id: "sre", slug: "sre" },
  { id: "systems-administrator", slug: "systems-administrator" },
  { id: "ux-designer", slug: "ux-designer" },
  { id: "ui-designer", slug: "ui-designer" },
  { id: "ux-ui-designer", slug: "ux-ui-designer" },
  { id: "product-designer", slug: "product-designer" },
  { id: "graphic-designer", slug: "graphic-designer" },
  { id: "product-manager", slug: "product-manager" },
  { id: "project-manager", slug: "project-manager" },
  { id: "engineering-manager", slug: "engineering-manager" },
  { id: "tech-lead", slug: "tech-lead" },
  { id: "scrum-master", slug: "scrum-master" },
  { id: "agile-coach", slug: "agile-coach" },
  { id: "business-analyst", slug: "business-analyst" },
  { id: "sales-representative", slug: "sales-representative" },
  { id: "account-manager", slug: "account-manager" },
  { id: "marketing-specialist", slug: "marketing-specialist" },
  { id: "copywriter", slug: "copywriter" },
  { id: "social-media-manager", slug: "social-media-manager" },
  { id: "seo-specialist", slug: "seo-specialist" },
  { id: "hr-specialist", slug: "hr-specialist" },
  { id: "tech-recruiter", slug: "tech-recruiter" },
  { id: "finance-specialist", slug: "finance-specialist" },
  { id: "accountant", slug: "accountant" },
  { id: "operations-manager", slug: "operations-manager" },
  { id: "consultant", slug: "consultant" },
  { id: "researcher", slug: "researcher" },
  { id: "teacher", slug: "teacher" },
  { id: "entrepreneur", slug: "entrepreneur" },
  { id: "student", slug: "student" },
] as const

export type RoleItem = (typeof PREDEFINED_ROLES)[number]

type RoleSelectorProps = {
  selectedRoles?: string[]
  selectedRole?: string
  onSelectRole: (role: string) => void
  onRemoveRole?: (role: string) => void
  onClearRole?: () => void
  error?: string | null
}

export function RoleSelector({
  selectedRoles,
  selectedRole,
  onSelectRole,
  onRemoveRole,
  onClearRole,
  error,
}: RoleSelectorProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const activeRoles = useMemo(() => {
    if (selectedRoles) return selectedRoles
    if (selectedRole) return [selectedRole]
    return []
  }, [selectedRole, selectedRoles])

  // Opens on the field of the first chosen role, otherwise on none until a field is picked.
  const [fieldId, setFieldId] = useState<RoleFieldId | undefined>(() =>
    activeRoles[0] ? fieldOfRole(activeRoles[0]) : undefined,
  )
  const field = ROLE_FIELDS.find((item) => item.id === fieldId)

  const getRoleLabel = useCallback(
    (roleSlugOrId: string): string => {
      const key = `roles.${roleSlugOrId}`
      const translated = (t as (k: string, opts?: { defaultValue?: string }) => string)(key, {
        defaultValue: roleSlugOrId,
      })
      return translated === key ? roleSlugOrId : translated
    },
    [t],
  )

  const searchResults = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()

    // Nothing until the person types, so opening the search does not dump all roles.
    if (lowerSearch === "") return []

    return PREDEFINED_ROLES.filter((role) => {
      if (activeRoles.includes(role.id) || activeRoles.includes(role.slug)) return false
      return (
        getRoleLabel(role.slug).toLowerCase().includes(lowerSearch) ||
        role.slug.toLowerCase().includes(lowerSearch)
      )
    })
  }, [activeRoles, getRoleLabel, search])

  // Chosen roles that the open field does not show, so none of them is ever hidden.
  const fieldRoles: readonly string[] = field?.roles ?? []
  const otherRoles = activeRoles.filter((role) => !fieldRoles.includes(role))

  const handleRemove = (roleSlug: string) => {
    if (onRemoveRole) {
      onRemoveRole(roleSlug)
    } else if (onClearRole) {
      onClearRole()
    }
  }

  return (
    <OnboardingCard
      title={t("onboarding.step1.role")}
      hint={t("onboarding.step1.roleHint")}
      isInvalid={Boolean(error)}
      className="gap-3.5"
    >
      <div className="flex flex-wrap gap-2">
        {ROLE_FIELDS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === fieldId ? "default" : "outline"}
            aria-pressed={item.id === fieldId}
            onClick={() => setFieldId(item.id)}
            className={cn("h-auto px-3 py-2", item.id !== fieldId && "bg-card")}
          >
            {/* Decorative: the label is written next to it. One face per field, seeded by its id; it follows the mouse while hovered (a row of chips is a list). */}
            <HoverGazeBlobatar
              name={`field-${item.id}`}
              className="size-6"
            />
            {t(item.labelKey)}
          </Button>
        ))}
      </div>

      {(field !== undefined || otherRoles.length > 0 || isSearching) && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
          {field && (
            <>
              <p className="font-mono text-meta tracking-meta text-muted-foreground uppercase">
                {t(field.labelKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {field.roles.map((slug) => {
                  const label = getRoleLabel(slug)
                  const isSelected = activeRoles.includes(slug)
                  return (
                    <Button
                      key={slug}
                      type="button"
                      variant="outline"
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected
                          ? t("onboarding.step1.removeRole", { name: label })
                          : t("onboarding.step1.addRole", { name: label })
                      }
                      onClick={() => {
                        if (isSelected) handleRemove(slug)
                        else onSelectRole(slug)
                      }}
                      className={cn(
                        "h-auto gap-1 rounded-full px-3 py-1.5 text-small font-normal",
                        isSelected
                          ? "border-highlight bg-highlight-soft text-highlight hover:bg-highlight-soft hover:text-highlight"
                          : "bg-card",
                      )}
                    >
                      {isSelected ? <Check className="size-3 stroke-[2.5]" /> : null}
                      {label}
                    </Button>
                  )
                })}
              </div>
            </>
          )}

          {otherRoles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {otherRoles.map((slug) => (
                <TagBadge
                  key={slug}
                  label={getRoleLabel(slug)}
                  variant="selected"
                  onAction={() => handleRemove(slug)}
                  actionAriaLabel={t("onboarding.step1.removeRole", { name: getRoleLabel(slug) })}
                />
              ))}
            </div>
          )}

          {isSearching ? (
            <>
              <Input
                id="search-role"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault()
                }}
                placeholder={t("onboarding.step1.searchRolePlaceholder")}
                aria-label={t("onboarding.step1.searchRoleAria")}
              />
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((role) => (
                  <TagBadge
                    key={role.id}
                    label={getRoleLabel(role.slug)}
                    variant="suggested"
                    onAction={() => {
                      onSelectRole(role.slug)
                      setSearch("")
                    }}
                    actionAriaLabel={t("onboarding.step1.addRole", {
                      name: getRoleLabel(role.slug),
                    })}
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
          {t("onboarding.step1.searchAllRoles")}
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
