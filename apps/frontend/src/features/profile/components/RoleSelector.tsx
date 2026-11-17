import { useTranslation } from "react-i18next"

import { useSlugLabel } from "@/lib/useSlugLabel"

import { CategoryPicker } from "@/features/profile/components/CategoryPicker"
import { ROLE_FIELDS } from "@/features/profile/lib/roleFields"

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
  const slugLabel = useSlugLabel()

  const groups = ROLE_FIELDS.map((field) => ({ id: field.id, label: t(field.labelKey) }))
  const items = ROLE_FIELDS.flatMap((field) =>
    field.roles.map((slug) => ({
      id: slug,
      slug,
      label: slugLabel("roles", slug),
      groupIds: [field.id],
    })),
  )

  return (
    <CategoryPicker
      title={t("onboarding.step1.role")}
      hint={t("onboarding.step1.roleHint")}
      groups={groups}
      items={items}
      selectedIds={selectedRoles ?? (selectedRole ? [selectedRole] : [])}
      onSelect={onSelectRole}
      onRemove={(role) => (onRemoveRole ? onRemoveRole(role) : onClearRole?.())}
      addLabel={(name) => t("onboarding.step1.addRole", { name })}
      removeLabel={(name) => t("onboarding.step1.removeRole", { name })}
      searchLinkLabel={t("onboarding.step1.searchAllRoles")}
      searchPlaceholder={t("onboarding.step1.searchRolePlaceholder")}
      searchAriaLabel={t("onboarding.step1.searchRoleAria")}
      error={error}
    />
  )
}
