import { useTranslation } from "react-i18next"

import type { ReferenceTag } from "@/features/profile/api/profileApi"
import type { OnboardingDraft } from "@/features/profile/lib/onboardingDraft"
import type { OnboardingPageId } from "@/features/profile/lib/onboardingPages"

type OnboardingSummaryProps = {
  draft: OnboardingDraft
  allTags: ReferenceTag[]
  onEdit: (page: OnboardingPageId) => void
}

/** What step 1 has collected, each with an Edit that goes back to that question (Figma B1e). */
export function OnboardingSummary({ draft, allTags, onEdit }: OnboardingSummaryProps) {
  const { t } = useTranslation()

  const label = (group: "roles" | "tags", slugOrId: string) => {
    const key = `${group}.${slugOrId}`
    const translated = (t as (k: string, opts?: { defaultValue?: string }) => string)(key, {
      defaultValue: slugOrId,
    })
    return translated === key ? slugOrId : translated
  }
  const tags = (ids: string[]) =>
    ids.flatMap((id) => {
      const tag = allTags.find((item) => item.id === id)
      return tag ? [label("tags", tag.slug)] : []
    })

  const rows: { page: OnboardingPageId; title: string; values: string[] }[] = [
    {
      page: "role",
      title: t("onboarding.summary.role"),
      values: draft.roles.map((role) => label("roles", role)),
    },
    { page: "teach", title: t("onboarding.summary.teach"), values: tags(draft.teachTagIds) },
    { page: "learn", title: t("onboarding.summary.learn"), values: tags(draft.learnTagIds) },
    {
      page: "interests",
      title: t("onboarding.summary.interests"),
      values: tags(draft.interestTagIds),
    },
  ]

  return (
    <dl className="flex flex-col gap-3.5">
      {rows.map((row) => (
        <div
          key={row.page}
          className="flex items-center gap-4 py-1"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <dt className="text-label text-muted-foreground uppercase">{row.title}</dt>
            <dd className="text-compact font-medium text-foreground">
              {row.values.length > 0 ? row.values.join(", ") : t("onboarding.summary.none")}
            </dd>
          </div>
          <button
            type="button"
            onClick={() => onEdit(row.page)}
            aria-label={`${t("common.edit")}: ${row.title}`}
            className="shrink-0 cursor-pointer text-small text-highlight underline underline-offset-2"
          >
            {t("common.edit")}
          </button>
        </div>
      ))}
    </dl>
  )
}
