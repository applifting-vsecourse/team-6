import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

import type { Tag } from "@/features/profile/api/profileApi"
import { RoleSelector } from "@/features/profile/components/RoleSelector"
import { TagSelector } from "@/features/profile/components/TagSelector"

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
  onContinue: (data: Step1Data) => void
}

export function Step1Profile({ initialData, allTags, onContinue }: Step1ProfileProps) {
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
      className="flex flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-title text-foreground">{t("onboarding.step1.title")}</h1>
        <p className="text-lg text-foreground/80">{t("onboarding.step1.description")}</p>
      </div>

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
        />
      </div>

      <TagSelector
        title={t("onboarding.step1.teachTitle")}
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
        hint={t("onboarding.step1.teachHint")}
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
        hint={t("onboarding.step1.teachHint")}
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

      <div className="flex flex-col-reverse items-start justify-between gap-4 pt-2 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">{t("onboarding.step1.changeLaterNote")}</p>
        <Button
          type="submit"
          className="w-full sm:w-auto"
        >
          {t("common.continue")}
        </Button>
      </div>
    </form>
  )
}
