// The role picker groups the predefined roles into fields (Figma B1). Frontend only: the profile
// still stores role slugs, so a role outside this map cannot be saved by the picker.
export const ROLE_FIELDS = [
  {
    id: "tech",
    labelKey: "onboarding.step1.fields.tech",
    roles: [
      "software-engineer",
      "frontend-developer",
      "backend-developer",
      "fullstack-developer",
      "mobile-developer",
      "devops-engineer",
      "cloud-architect",
      "solution-architect",
      "software-architect",
      "qa-engineer",
      "security-engineer",
      "sre",
      "systems-administrator",
      "tech-lead",
    ],
  },
  {
    id: "data",
    labelKey: "onboarding.step1.fields.data",
    roles: [
      "data-engineer",
      "data-scientist",
      "data-analyst",
      "machine-learning-engineer",
      "ai-engineer",
    ],
  },
  {
    id: "design",
    labelKey: "onboarding.step1.fields.design",
    roles: ["ux-designer", "ui-designer", "ux-ui-designer", "product-designer", "graphic-designer"],
  },
  {
    id: "product",
    labelKey: "onboarding.step1.fields.product",
    roles: [
      "product-manager",
      "project-manager",
      "engineering-manager",
      "scrum-master",
      "agile-coach",
      "business-analyst",
      "operations-manager",
    ],
  },
  {
    id: "marketing",
    labelKey: "onboarding.step1.fields.marketing",
    roles: [
      "marketing-specialist",
      "copywriter",
      "social-media-manager",
      "seo-specialist",
      "sales-representative",
      "account-manager",
    ],
  },
  {
    id: "people",
    labelKey: "onboarding.step1.fields.people",
    roles: ["hr-specialist", "tech-recruiter", "finance-specialist", "accountant"],
  },
  {
    id: "education",
    labelKey: "onboarding.step1.fields.education",
    roles: ["teacher", "researcher", "consultant", "entrepreneur", "student"],
  },
] as const

export type RoleFieldId = (typeof ROLE_FIELDS)[number]["id"]

export function fieldOfRole(slug: string): RoleFieldId | undefined {
  return ROLE_FIELDS.find((field) => (field.roles as readonly string[]).includes(slug))?.id
}
