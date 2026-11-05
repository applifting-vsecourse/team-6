import { useCallback, useMemo, useState } from "react"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Blobatar } from "@/components/ui/blobatar"
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

    return PREDEFINED_ROLES.filter((role) => {
      if (activeRoles.includes(role.id) || activeRoles.includes(role.slug)) return false
      if (lowerSearch === "") return true
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
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === fieldId}
            onClick={() => setFieldId(item.id)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg border py-2 pr-3 pl-2 text-label font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              item.id === fieldId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-secondary",
            )}
          >
            <Blobatar
              name={item.id}
              className="size-6"
            />
            {t(item.labelKey)}
          </button>
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
                    <button
                      key={slug}
                      type="button"
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
                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-small transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "border-highlight bg-highlight-soft text-highlight"
                          : "border-input bg-card text-foreground hover:bg-secondary",
                      )}
                    >
                      {isSelected ? <Check className="size-3 stroke-[2.5]" /> : null}
                      {label}
                    </button>
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
        <button
          type="button"
          onClick={() => setIsSearching(true)}
          className="w-fit cursor-pointer text-small text-highlight underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("onboarding.step1.searchAllRoles")}
        </button>
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
