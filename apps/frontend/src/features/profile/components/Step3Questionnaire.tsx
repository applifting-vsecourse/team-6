import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { MeetingFrequency } from "@/features/profile/api/profileApi"

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
  const frequencySectionRef = useRef<HTMLDivElement | null>(null)

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
      className="flex flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-title text-foreground">{t("onboarding.step3.title")}</h1>
        <p className="text-lg text-foreground/80">{t("onboarding.step3.description")}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step3.expectationsTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("onboarding.step3.expectationsHint")}</p>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          {expectationOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <Checkbox
                checked={expectations.includes(opt.id)}
                onCheckedChange={() => toggleExpectation(opt.id)}
              />
              <span className="text-base text-foreground">{t(opt.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div
        ref={frequencySectionRef}
        className={cn(
          "flex flex-col gap-3 border-t border-border pt-6 transition-colors",
          error && "rounded-lg border border-destructive/60 bg-destructive/5 p-4",
        )}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step3.frequencyTitle")}
          </h3>
          {error && (
            <p
              className="text-sm font-medium text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <RadioGroup
          value={meetingFrequency ?? ""}
          onValueChange={(val) => {
            setMeetingFrequency(val as MeetingFrequency)
            if (error) setError(null)
          }}
          className="gap-3 pt-1"
        >
          {frequencyOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <RadioGroupItem
                value={opt.id}
                id={`freq-${opt.id}`}
              />
              <span className="text-base text-foreground">{t(opt.labelKey)}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step3.noteTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("onboarding.step3.noteOptional")}</p>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
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
        </div>
      </div>

      <div className="flex flex-col-reverse items-start justify-between gap-4 pt-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {t("common.back")}
        </Button>
        <div className="flex w-full flex-col-reverse items-start gap-4 sm:w-auto sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">{t("onboarding.step3.finishHint")}</p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? t("common.saving") : t("common.finish")}
          </Button>
        </div>
      </div>
    </form>
  )
}
