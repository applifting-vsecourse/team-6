import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

import type { MeetingFrequency } from "@/features/profile/api/profileApi"
import { OnboardingCard } from "@/features/profile/components/OnboardingCard"
import { OnboardingTitle } from "@/features/profile/components/OnboardingTitle"
import { checkboxClass, radioClass } from "@/features/profile/lib/optionStyles"

type Step3Data = {
  expectations: string[]
  meetingFrequency?: MeetingFrequency
  note: string
}

type Step3QuestionnaireProps = {
  initialData: Step3Data
  isSubmitting?: boolean
  onBack: () => void
  onFinish: (data: Step3Data) => void
}

export function Step3Questionnaire({
  initialData,
  isSubmitting = false,
  onBack,
  onFinish,
}: Step3QuestionnaireProps) {
  const { t } = useTranslation()

  const [expectations, setExpectations] = useState<string[]>(initialData.expectations)
  const [meetingFrequency, setMeetingFrequency] = useState<MeetingFrequency | undefined>(
    initialData.meetingFrequency,
  )
  const [note, setNote] = useState(initialData.note)
  const [error, setError] = useState<string | null>(null)
  const frequencySectionRef = useRef<HTMLElement | null>(null)

  const expectationOptions: {
    id: string
    labelKey:
      | "onboarding.step3.expectations.learn"
      | "onboarding.step3.expectations.share"
      | "onboarding.step3.expectations.meet"
      | "onboarding.step3.expectations.solve"
  }[] = [
    { id: "learn_new", labelKey: "onboarding.step3.expectations.learn" },
    { id: "share_knowledge", labelKey: "onboarding.step3.expectations.share" },
    { id: "meet_people", labelKey: "onboarding.step3.expectations.meet" },
    { id: "solve_problem", labelKey: "onboarding.step3.expectations.solve" },
  ]

  const frequencyOptions: {
    id: MeetingFrequency
    labelKey:
      | "onboarding.step3.frequency.weekly"
      | "onboarding.step3.frequency.biweekly"
      | "onboarding.step3.frequency.monthly"
  }[] = [
    { id: "WEEKLY", labelKey: "onboarding.step3.frequency.weekly" },
    { id: "BIWEEKLY", labelKey: "onboarding.step3.frequency.biweekly" },
    { id: "MONTHLY", labelKey: "onboarding.step3.frequency.monthly" },
  ]

  const toggleExpectation = (id: string) => {
    setExpectations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingFrequency) {
      setError(t("onboarding.step3.frequencyRequired"))
      frequencySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setError(null)
    onFinish({
      expectations,
      meetingFrequency,
      note: note.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 md:gap-6"
    >
      <OnboardingTitle
        title={t("onboarding.step3.title")}
        description={t("onboarding.step3.description")}
      />

      <OnboardingCard
        title={t("onboarding.step3.expectationsTitle")}
        hint={t("onboarding.step3.expectationsHint")}
      >
        <div className="flex flex-col gap-3">
          {expectationOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2.5 text-compact text-foreground"
            >
              <Checkbox
                className={checkboxClass}
                checked={expectations.includes(opt.id)}
                onCheckedChange={() => toggleExpectation(opt.id)}
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </div>
      </OnboardingCard>

      <OnboardingCard
        ref={frequencySectionRef}
        title={t("onboarding.step3.frequencyTitle")}
        isInvalid={Boolean(error)}
      >
        <RadioGroup
          value={meetingFrequency ?? ""}
          onValueChange={(val) => {
            setMeetingFrequency(val as MeetingFrequency)
            if (error) setError(null)
          }}
          className="gap-3"
        >
          {frequencyOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2.5 text-compact text-foreground"
            >
              <RadioGroupItem
                className={radioClass}
                value={opt.id}
                id={`freq-${opt.id}`}
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </RadioGroup>
        {error && (
          <p
            className="text-small font-medium text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </OnboardingCard>

      <OnboardingCard
        title={t("onboarding.step3.noteTitle")}
        hint={t("onboarding.step3.noteOptional")}
      >
        <Label
          htmlFor="onboarding-note"
          className="sr-only"
        >
          {t("onboarding.step3.noteTitle")}
        </Label>
        <Textarea
          id="onboarding-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("onboarding.step3.notePlaceholder")}
          rows={3}
        />
      </OnboardingCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {t("common.back")}
        </Button>
        <p className="order-last w-full text-small text-muted-foreground md:order-none md:w-auto md:flex-1">
          {t("onboarding.step3.finishHint")}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto md:ml-0"
        >
          {isSubmitting ? t("common.saving") : t("common.finish")}
        </Button>
      </div>
    </form>
  )
}
