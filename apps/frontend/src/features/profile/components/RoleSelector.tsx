import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"

import { ChoiceTile } from "@/features/profile/components/onboarding/ChoiceTile"
import { chipClass, softFieldClass } from "@/features/profile/lib/optionStyles"
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
  selectedRoles: string[]
  onSelectRole: (role: string) => void
  onRemoveRole: (role: string) => void
}

/**
 * Pick a field of work, then roles in it (Figma B1). A role chosen in another field, or found by
 * search, stays on the list, so nothing chosen is ever hidden.
 */
export function RoleSelector({ selectedRoles, onSelectRole, onRemoveRole }: RoleSelectorProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Opens on the field of the first chosen role, otherwise on none until a field is picked.
  const [fieldId, setFieldId] = useState<RoleFieldId | undefined>(() =>
    selectedRoles[0] ? fieldOfRole(selectedRoles[0]) : undefined,
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
      if (selectedRoles.includes(role.id) || selectedRoles.includes(role.slug)) return false
      return (
        getRoleLabel(role.slug).toLowerCase().includes(lowerSearch) ||
        role.slug.toLowerCase().includes(lowerSearch)
      )
    }).map((role) => role.slug)
  }, [selectedRoles, getRoleLabel, search])

  // The field's roles first, then the chosen ones from elsewhere, then what the search found.
  const fieldRoles: readonly string[] = field?.roles ?? []
  const elsewhere = selectedRoles.filter((role) => !fieldRoles.includes(role))
  const listed = [...fieldRoles, ...elsewhere, ...searchResults]

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-label text-muted-foreground">{t("onboarding.fieldLabel")}</p>
      <div className="flex flex-wrap gap-2">
        {ROLE_FIELDS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === fieldId}
            onClick={() => setFieldId(item.id)}
            className={chipClass(item.id === fieldId)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {field ? (
        <p className="text-label text-muted-foreground uppercase">
          {t("onboarding.roleIn", { field: t(field.labelKey) })}
        </p>
      ) : null}

      {listed.map((slug) => (
        <ChoiceTile
          key={slug}
          kind="check"
          label={getRoleLabel(slug)}
          isChecked={selectedRoles.includes(slug)}
          onCheckedChange={(isChecked) => {
            if (isChecked) {
              onSelectRole(slug)
              setSearch("")
            } else {
              onRemoveRole(slug)
            }
          }}
        />
      ))}

      {isSearching ? (
        <Input
          id="search-role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            // Enter in the search must not continue to the next page.
            if (event.key === "Enter") event.preventDefault()
          }}
          placeholder={t("onboarding.role.searchRolePlaceholder")}
          aria-label={t("onboarding.role.searchRoleAria")}
          className={`h-12.75 ${softFieldClass}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsSearching(true)}
          className="w-fit cursor-pointer text-small text-highlight underline underline-offset-2"
        >
          {t("onboarding.role.searchAllRoles")}
        </button>
      )}
    </div>
  )
}
