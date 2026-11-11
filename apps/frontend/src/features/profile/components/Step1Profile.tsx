import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { MascotCorner } from "@/components/Mascot/MascotCorner"
import { Button } from "@/components/ui/button"

import type { Tag } from "@/features/profile/api/profileApi"
import { OnboardingTitle } from "@/features/profile/components/OnboardingTitle"
import { RoleSelector } from "@/features/profile/components/RoleSelector"
import { TagSelector } from "@/features/profile/components/TagSelector"
import { GUIDE_READY_ID, useOnboardingGuide } from "@/features/profile/hooks/useOnboardingGuide"

export type Step1Data = {
  roles?: string[]
  position?: string
  teachTagIds: string[]
  learnTagIds: string[]
  interestTagIds: string[]
}

type Step1ProfileProps = {
  initialData: Step1Data
  allTags: Tag[]
  /** Seed of the person's avatar: while the tour runs, the mascot is that avatar. */
  mascotSeed?: string
  onContinue: (data: Step1Data) => void
}

export function Step1Profile({ initialData, allTags, mascotSeed, onContinue }: Step1ProfileProps) {
  const { t } = useTranslation()

  const [roles, setRoles] = useState<string[]>(() => {
    if (initialData.roles && initialData.roles.length > 0) return initialData.roles
    if (initialData.position?.trim()) return [initialData.position.trim()]
    return []
  })
  const [teachTagIds, setTeachTagIds] = useState<string[]>(initialData.teachTagIds)
  const [learnTagIds, setLearnTagIds] = useState<string[]>(initialData.learnTagIds)
  const [interestTagIds, setInterestTagIds] = useState<string[]>(initialData.interestTagIds)
  const [error, setError] = useState<string | null>(null)
  const roleSectionRef = useRef<HTMLDivElement | null>(null)

  useOnboardingGuide({
    seed: mascotSeed,
    readyText: t("tour.onboarding.step1Ready"),
    cards: [
      {
        id: "role",
        text: t("tour.onboarding.role"),
        isDone: roles.length > 0,
        answer: roles.join("|"),
        isManual: true,
      },
      {
        id: "teach",
        text: t("tour.onboarding.teach"),
        isDone: teachTagIds.length > 0,
        answer: teachTagIds.join("|"),
        isOptional: true,
        isManual: true,
      },
      {
        id: "learn",
        text: t("tour.onboarding.learn"),
        isDone: learnTagIds.length > 0,
        answer: learnTagIds.join("|"),
        isOptional: true,
        isManual: true,
      },
      {
        id: "interests",
        text: t("tour.onboarding.interests"),
        isDone: interestTagIds.length > 0,
        answer: interestTagIds.join("|"),
        isOptional: true,
        isManual: true,
      },
    ],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roles.length === 0) {
      setError(t("onboarding.step1.roleRequired"))
      roleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setError(null)
    onContinue({
      roles,
      position: roles[0] ?? "",
      teachTagIds,
      learnTagIds,
      interestTagIds,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 md:gap-6"
    >
      <OnboardingTitle
        title={t("onboarding.step1.title")}
        description={t("onboarding.step1.description")}
        avatarSeed={mascotSeed}
      />

      <div ref={roleSectionRef}>
        <RoleSelector
          selectedRoles={roles}
          onSelectRole={(role) => {
            setRoles((prev) => (prev.includes(role) ? prev : [...prev, role]))
            if (error) setError(null)
          }}
          onRemoveRole={(role) => {
            setRoles((prev) => prev.filter((r) => r !== role))
          }}
          error={error}
          mascotId="onboarding-role"
        />
      </div>

      <TagSelector
        title={t("onboarding.step1.teachTitle")}
        mascotId="onboarding-teach"
        hint={t("onboarding.step1.teachHint")}
        selectedTagIds={teachTagIds}
        allTags={allTags}
        defaultSuggestedSlugs={[
          "data-analysis",
          "public-speaking",
          "copywriting",
          "photography",
          "project-management",
          "excel",
          "spanish",
          "social-media",
          "python",
          "typescript",
          "react",
        ]}
        onSelectTag={(id) => setTeachTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
        onRemoveTag={(id) => setTeachTagIds((prev) => prev.filter((tId) => tId !== id))}
      />

      <TagSelector
        title={t("onboarding.step1.learnTitle")}
        mascotId="onboarding-learn"
        selectedTagIds={learnTagIds}
        allTags={allTags}
        defaultSuggestedSlugs={[
          "ux-design",
          "negotiation",
          "statistics",
          "machine-learning",
          "video-editing",
          "python",
          "sql",
          "docker",
          "kubernetes",
          "rust",
        ]}
        onSelectTag={(id) => setLearnTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
        onRemoveTag={(id) => setLearnTagIds((prev) => prev.filter((tId) => tId !== id))}
      />

      <TagSelector
        title={t("onboarding.step1.interestsTitle")}
        mascotId="onboarding-interests"
        selectedTagIds={interestTagIds}
        allTags={allTags}
        defaultSuggestedSlugs={[
          "running",
          "cooking",
          "travel",
          "startups",
          "music",
          "hiking",
          "board-games",
          "fitness",
          "gaming",
          "coffee",
        ]}
        onSelectTag={(id) =>
          setInterestTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
        }
        onRemoveTag={(id) => setInterestTagIds((prev) => prev.filter((tId) => tId !== id))}
      />

      <div className="relative md:w-fit">
        <Button
          type="submit"
          className="w-full md:w-fit"
        >
          {t("common.continue")}
        </Button>
        <MascotCorner id={GUIDE_READY_ID} />
      </div>
    </form>
  )
}
