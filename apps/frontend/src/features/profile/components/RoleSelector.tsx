import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { TagBadge } from "@/features/profile/components/TagBadge"

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

  const activeRoles = useMemo(() => {
    if (selectedRoles) return selectedRoles
    if (selectedRole) return [selectedRole]
    return []
  }, [selectedRole, selectedRoles])

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

  const suggestedRoles = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()

    if (lowerSearch !== "") {
      return PREDEFINED_ROLES.filter((role) => {
        if (activeRoles.includes(role.id) || activeRoles.includes(role.slug)) return false
        const label = getRoleLabel(role.slug).toLowerCase()
        return label.includes(lowerSearch) || role.slug.toLowerCase().includes(lowerSearch)
      })
    }

    return PREDEFINED_ROLES.filter(
      (role) => !activeRoles.includes(role.id) && !activeRoles.includes(role.slug),
    )
  }, [activeRoles, getRoleLabel, search])

  const handleRemove = (roleSlug: string) => {
    if (onRemoveRole) {
      onRemoveRole(roleSlug)
    } else if (onClearRole) {
      onClearRole()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <Label
          htmlFor="search-role"
          className="text-label font-semibold text-foreground"
        >
          {t("onboarding.step1.role")}
        </Label>
        <p className="text-sm text-muted-foreground">{t("onboarding.step1.roleHint")}</p>
      </div>

      {activeRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeRoles.map((roleSlug) => {
            const label = getRoleLabel(roleSlug)
            return (
              <TagBadge
                key={roleSlug}
                label={label}
                variant="selected"
                onAction={() => handleRemove(roleSlug)}
                actionAriaLabel={t("onboarding.step1.removeRole", { name: label })}
              />
            )
          })}
        </div>
      )}

      <div>
        <Input
          id="search-role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault()
          }}
          placeholder={t("onboarding.step1.searchRolePlaceholder")}
          aria-label={t("onboarding.step1.searchRoleAria")}
          className="h-10 text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {suggestedRoles.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
            {t("onboarding.step1.recommendedRoles")}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedRoles.map((role) => (
              <TagBadge
                key={role.id}
                label={getRoleLabel(role.slug)}
                variant="suggested"
                onAction={() => {
                  onSelectRole(role.slug)
                  setSearch("")
                }}
                actionAriaLabel={t("onboarding.step1.addRole", { name: getRoleLabel(role.slug) })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
