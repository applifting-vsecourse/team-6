import { useTranslation } from "react-i18next"

import { useSlugLabel } from "@/lib/useSlugLabel"

import { ChipPicker } from "@/features/profile/components/onboarding/ChipPicker"
import { fieldOfRole, ROLE_FIELDS } from "@/features/profile/lib/roleFields"

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

type RoleSelectorProps = {
  selectedRoles: string[]
  onSelectRole: (role: string) => void
  onRemoveRole: (role: string) => void
}

/** Roles, picked like topics: a field of work to browse, a search over all roles, chips (Figma B1). */
export function RoleSelector({ selectedRoles, onSelectRole, onRemoveRole }: RoleSelectorProps) {
  const { t } = useTranslation()
  const slugLabel = useSlugLabel()

  return (
    <ChipPicker
      groups={ROLE_FIELDS.map((field) => ({ id: field.id, label: t(field.labelKey) }))}
      groupLabel={t("onboarding.fieldLabel")}
      items={PREDEFINED_ROLES.map(({ slug }) => {
        const field = fieldOfRole(slug)
        return { id: slug, slug, label: slugLabel("roles", slug), groupIds: field ? [field] : [] }
      })}
      selectedIds={selectedRoles}
      onSelect={onSelectRole}
      onRemove={onRemoveRole}
      addLabel={(name) => t("onboarding.role.addRole", { name })}
      removeLabel={(name) => t("onboarding.role.removeRole", { name })}
      searchPlaceholder={t("onboarding.role.searchRolePlaceholder")}
      searchAriaLabel={t("onboarding.role.searchRoleAria")}
      noneLabel={t("onboarding.role.none")}
    />
  )
}
