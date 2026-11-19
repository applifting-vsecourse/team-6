import { useTranslation } from "react-i18next"

import { RadioGroup } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/date"
import { cn } from "@/lib/utils"

import type { MeetingFrequency, Tag } from "@/features/profile/api/profileApi"
import { LocationMapPicker } from "@/features/profile/components/LocationMapPicker"
import { ChoiceTile } from "@/features/profile/components/onboarding/ChoiceTile"
import { OnboardingSummary } from "@/features/profile/components/onboarding/OnboardingSummary"
import { RoleSelector } from "@/features/profile/components/RoleSelector"
import { TagSelector } from "@/features/profile/components/TagSelector"
import { NOTE_MAX_LENGTH, type OnboardingDraft } from "@/features/profile/lib/onboardingDraft"
import type { OnboardingPageId } from "@/features/profile/lib/onboardingPages"
import { softFieldClass } from "@/features/profile/lib/optionStyles"
import { SUGGESTED_TAG_SLUGS } from "@/features/profile/lib/suggestedTags"

type OnboardingAnswersProps = {
  page: OnboardingPageId
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
  allTags: Tag[]
  /** From the summary: back to one of the questions. */
  onEdit: (page: OnboardingPageId) => void
}

const EXPECTATIONS = [
  { id: "learn_new", labelKey: "onboarding.expectations.learn" },
  { id: "share_knowledge", labelKey: "onboarding.expectations.share" },
  { id: "meet_people", labelKey: "onboarding.expectations.meet" },
  { id: "solve_problem", labelKey: "onboarding.expectations.solve" },
] as const

const FREQUENCIES = [
  { id: "WEEKLY", labelKey: "onboarding.frequency.weekly" },
  { id: "BIWEEKLY", labelKey: "onboarding.frequency.biweekly" },
  { id: "MONTHLY", labelKey: "onboarding.frequency.monthly" },
] as const

const toggle = (list: string[], id: string, isOn: boolean) =>
  isOn ? (list.includes(id) ? list : [...list, id]) : list.filter((item) => item !== id)

/** The answers of one page: what sits under the avatar's question. */
export function OnboardingAnswers({
  page,
  draft,
  onChange,
  allTags,
  onEdit,
}: OnboardingAnswersProps) {
  const { t } = useTranslation()

  const tags = (key: "teach" | "learn" | "interests") => {
    const field = (
      { teach: "teachTagIds", learn: "learnTagIds", interests: "interestTagIds" } as const
    )[key]
    return (
      <TagSelector
        selectedTagIds={draft[field]}
        allTags={allTags}
        defaultSuggestedSlugs={[...SUGGESTED_TAG_SLUGS[key]]}
        onSelectTag={(id) => onChange({ [field]: toggle(draft[field], id, true) })}
        onRemoveTag={(id) => onChange({ [field]: toggle(draft[field], id, false) })}
      />
    )
  }

  switch (page) {
    case "role":
      return (
        <RoleSelector
          selectedRoles={draft.roles}
          onSelectRole={(role) => onChange({ roles: toggle(draft.roles, role, true) })}
          onRemoveRole={(role) => onChange({ roles: toggle(draft.roles, role, false) })}
        />
      )
    case "teach":
    case "learn":
    case "interests":
      return tags(page)
    case "summary":
      return (
        <OnboardingSummary
          draft={draft}
          allTags={allTags}
          onEdit={onEdit}
        />
      )
    case "days":
      return (
        <>
          <ChoiceTile
            kind="check"
            label={t("onboarding.days.weekdays")}
            isChecked={draft.weekdays}
            onCheckedChange={(isChecked) => onChange({ weekdays: isChecked })}
          />
          <ChoiceTile
            kind="check"
            label={t("onboarding.days.weekends")}
            isChecked={draft.weekends}
            onCheckedChange={(isChecked) => onChange({ weekends: isChecked })}
          />
        </>
      )
    case "time":
      return (
        <>
          <ChoiceTile
            kind="check"
            label={t("onboarding.time.mornings")}
            isChecked={draft.mornings}
            onCheckedChange={(isChecked) => onChange({ mornings: isChecked })}
          />
          <ChoiceTile
            kind="check"
            label={t("onboarding.time.afternoons")}
            isChecked={draft.afternoons}
            onCheckedChange={(isChecked) => onChange({ afternoons: isChecked })}
          />
          <ChoiceTile
            kind="check"
            label={t("onboarding.time.evenings")}
            isChecked={draft.evenings}
            onCheckedChange={(isChecked) => onChange({ evenings: isChecked })}
          />
        </>
      )
    case "place":
      return (
        <LocationMapPicker
          latitude={draft.latitude}
          longitude={draft.longitude}
          radiusKm={draft.radiusKm}
          onChange={(location) =>
            onChange({
              latitude: location.latitude,
              longitude: location.longitude,
              radiusKm: location.radiusKm,
            })
          }
        />
      )
    case "expectations":
      return (
        <>
          {EXPECTATIONS.map((item) => (
            <ChoiceTile
              key={item.id}
              kind="check"
              label={t(item.labelKey)}
              isChecked={draft.expectations.includes(item.id)}
              onCheckedChange={(isChecked) =>
                onChange({ expectations: toggle(draft.expectations, item.id, isChecked) })
              }
            />
          ))}
        </>
      )
    case "frequency":
      return (
        <RadioGroup
          value={draft.meetingFrequency ?? ""}
          onValueChange={(value) => onChange({ meetingFrequency: value as MeetingFrequency })}
          className="gap-3.5"
          aria-label={t("onboarding.guide.frequency.title")}
        >
          {FREQUENCIES.map((item) => (
            <ChoiceTile
              key={item.id}
              kind="radio"
              label={t(item.labelKey)}
              value={item.id}
            />
          ))}
        </RadioGroup>
      )
    case "note": {
      const isOver = draft.note.length > NOTE_MAX_LENGTH
      return (
        <div className="flex flex-col gap-2.5">
          <Textarea
            value={draft.note}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder={t("onboarding.note.placeholder")}
            aria-label={t("onboarding.note.label")}
            aria-invalid={isOver}
            rows={5}
            className={cn("min-h-40 resize-none py-3.5", softFieldClass)}
          />
          <p
            className={cn(
              "text-right font-mono text-meta tracking-meta uppercase",
              isOver ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {t("onboarding.note.counter", {
              count: formatNumber(draft.note.length),
              max: formatNumber(NOTE_MAX_LENGTH),
            })}
          </p>
        </div>
      )
    }
  }
}
