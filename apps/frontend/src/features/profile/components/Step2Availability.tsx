import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  DEFAULT_RADIUS_KM,
  LocationMapPicker,
} from "@/features/profile/components/LocationMapPicker"
import { OnboardingCard } from "@/features/profile/components/OnboardingCard"
import { OnboardingTitle } from "@/features/profile/components/OnboardingTitle"
import { checkboxClass } from "@/features/profile/lib/optionStyles"

export type Step2Data = {
  weekdays: boolean
  weekends: boolean
  mornings: boolean
  afternoons: boolean
  evenings: boolean
  radiusKm: number
  latitude?: number | null
  longitude?: number | null
}

type Step2AvailabilityProps = {
  initialData: Step2Data
  onBack: () => void
  onContinue: (data: Step2Data) => void
}

export function Step2Availability({ initialData, onBack, onContinue }: Step2AvailabilityProps) {
  const { t } = useTranslation()

  const [hasWeekdays, setHasWeekdays] = useState(initialData.weekdays)
  const [hasWeekends, setHasWeekends] = useState(initialData.weekends)
  const [hasMornings, setHasMornings] = useState(initialData.mornings)
  const [hasAfternoons, setHasAfternoons] = useState(initialData.afternoons)
  const [hasEvenings, setHasEvenings] = useState(initialData.evenings)
  const [radiusKm, setRadiusKm] = useState(
    initialData.radiusKm > 0 ? initialData.radiusKm : DEFAULT_RADIUS_KM,
  )
  const [latitude, setLatitude] = useState<number | null>(initialData.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(initialData.longitude ?? null)

  const [daysError, setDaysError] = useState<string | null>(null)
  const [timeOfDayError, setTimeOfDayError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const daysSectionRef = useRef<HTMLElement | null>(null)
  const timeOfDaySectionRef = useRef<HTMLElement | null>(null)
  const mapSectionRef = useRef<HTMLElement | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let hasError = false
    if (!hasWeekdays && !hasWeekends) {
      setDaysError(t("onboarding.step2.daysRequired"))
      daysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      hasError = true
    } else {
      setDaysError(null)
    }

    if (!hasMornings && !hasAfternoons && !hasEvenings) {
      setTimeOfDayError(t("onboarding.step2.timeOfDayRequired"))
      if (!hasError) {
        timeOfDaySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      hasError = true
    } else {
      setTimeOfDayError(null)
    }

    if (latitude == null || longitude == null) {
      setLocationError(t("onboarding.step2.locationRequired"))
      if (!hasError) {
        mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      hasError = true
    } else {
      setLocationError(null)
    }

    if (hasError) return

    onContinue({
      weekdays: hasWeekdays,
      weekends: hasWeekends,
      mornings: hasMornings,
      afternoons: hasAfternoons,
      evenings: hasEvenings,
      radiusKm,
      latitude,
      longitude,
    })
  }

  const option = (
    isChecked: boolean,
    label: string,
    onCheckedChange: (isChecked: boolean) => void,
  ) => (
    <label className="flex cursor-pointer items-center gap-2.5 text-compact text-foreground">
      <Checkbox
        className={checkboxClass}
        checked={isChecked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
      />
      {label}
    </label>
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 md:gap-6"
    >
      <OnboardingTitle
        title={t("onboarding.step2.title")}
        description={t("onboarding.step2.description")}
      />

      <OnboardingCard
        ref={daysSectionRef}
        title={t("onboarding.step2.daysTitle")}
        isInvalid={Boolean(daysError)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:gap-7">
          {option(hasWeekdays, t("onboarding.step2.weekdays"), (isChecked) => {
            setHasWeekdays(isChecked)
            if (isChecked || hasWeekends) setDaysError(null)
          })}
          {option(hasWeekends, t("onboarding.step2.weekends"), (isChecked) => {
            setHasWeekends(isChecked)
            if (isChecked || hasWeekdays) setDaysError(null)
          })}
        </div>
        {daysError && (
          <p
            className="text-small font-medium text-destructive"
            role="alert"
          >
            {daysError}
          </p>
        )}
      </OnboardingCard>

      <OnboardingCard
        ref={timeOfDaySectionRef}
        title={t("onboarding.step2.timeOfDayTitle")}
        isInvalid={Boolean(timeOfDayError)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:gap-7">
          {option(hasMornings, t("onboarding.step2.mornings"), (isChecked) => {
            setHasMornings(isChecked)
            if (isChecked || hasAfternoons || hasEvenings) setTimeOfDayError(null)
          })}
          {option(hasAfternoons, t("onboarding.step2.afternoons"), (isChecked) => {
            setHasAfternoons(isChecked)
            if (hasMornings || isChecked || hasEvenings) setTimeOfDayError(null)
          })}
          {option(hasEvenings, t("onboarding.step2.evenings"), (isChecked) => {
            setHasEvenings(isChecked)
            if (hasMornings || hasAfternoons || isChecked) setTimeOfDayError(null)
          })}
        </div>
        {timeOfDayError && (
          <p
            className="text-small font-medium text-destructive"
            role="alert"
          >
            {timeOfDayError}
          </p>
        )}
      </OnboardingCard>

      <OnboardingCard
        ref={mapSectionRef}
        isInvalid={Boolean(locationError)}
      >
        <LocationMapPicker
          latitude={latitude}
          longitude={longitude}
          radiusKm={radiusKm}
          onChange={(loc) => {
            setLatitude(loc.latitude)
            setLongitude(loc.longitude)
            setRadiusKm(loc.radiusKm)
            setLocationError(null)
          }}
        />

        {locationError && (
          <p
            role="alert"
            className="text-small font-medium text-destructive"
          >
            {locationError}
          </p>
        )}
      </OnboardingCard>

      <div className="flex items-center gap-3 md:justify-between">
        <Button
          type="button"
          variant="outline"
          className="flex-1 bg-card md:flex-none"
          onClick={onBack}
        >
          {t("common.back")}
        </Button>
        <Button
          type="submit"
          className="flex-1 md:flex-none"
        >
          {t("common.continue")}
        </Button>
      </div>
    </form>
  )
}
