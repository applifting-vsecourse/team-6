import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import {
  DEFAULT_RADIUS_KM,
  LocationMapPicker,
} from "@/features/profile/components/LocationMapPicker"

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

export function Step2Availability({
  initialData,
  onBack,
  onContinue,
}: Step2AvailabilityProps) {
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

  const daysSectionRef = useRef<HTMLDivElement | null>(null)
  const timeOfDaySectionRef = useRef<HTMLDivElement | null>(null)
  const mapSectionRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-title text-foreground">{t("onboarding.step2.title")}</h1>
        <p className="text-lg text-foreground/80">{t("onboarding.step2.description")}</p>
      </div>

      <div
        ref={daysSectionRef}
        className={cn(
          "flex flex-col gap-3 border-t border-border pt-6 transition-colors",
          daysError && "rounded-lg border border-destructive/60 bg-destructive/5 p-4",
        )}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step2.daysTitle")}
          </h3>
          {daysError && (
            <p
              className="text-sm font-medium text-destructive"
              role="alert"
            >
              {daysError}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={hasWeekdays}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setHasWeekdays(isChecked)
                if (isChecked || hasWeekends) setDaysError(null)
              }}
            />
            <span className="text-base text-foreground">{t("onboarding.step2.weekdays")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={hasWeekends}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setHasWeekends(isChecked)
                if (isChecked || hasWeekdays) setDaysError(null)
              }}
            />
            <span className="text-base text-foreground">{t("onboarding.step2.weekends")}</span>
          </label>
        </div>
      </div>

      <div
        ref={timeOfDaySectionRef}
        className={cn(
          "flex flex-col gap-3 border-t border-border pt-6 transition-colors",
          timeOfDayError && "rounded-lg border border-destructive/60 bg-destructive/5 p-4",
        )}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step2.timeOfDayTitle")}
          </h3>
          {timeOfDayError && (
            <p
              className="text-sm font-medium text-destructive"
              role="alert"
            >
              {timeOfDayError}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={hasMornings}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setHasMornings(isChecked)
                if (isChecked || hasAfternoons || hasEvenings) setTimeOfDayError(null)
              }}
            />
            <span className="text-base text-foreground">{t("onboarding.step2.mornings")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={hasAfternoons}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setHasAfternoons(isChecked)
                if (hasMornings || isChecked || hasEvenings) setTimeOfDayError(null)
              }}
            />
            <span className="text-base text-foreground">{t("onboarding.step2.afternoons")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={hasEvenings}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked)
                setHasEvenings(isChecked)
                if (hasMornings || hasAfternoons || isChecked) setTimeOfDayError(null)
              }}
            />
            <span className="text-base text-foreground">{t("onboarding.step2.evenings")}</span>
          </label>
        </div>
      </div>

      <div
        ref={mapSectionRef}
        className="flex flex-col gap-3 border-t border-border pt-6"
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="font-serif text-subheading font-semibold text-foreground">
            {t("onboarding.step2.whereTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("onboarding.step2.whereHint")}</p>
        </div>

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
            className="text-sm font-medium text-destructive"
          >
            {locationError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          {t("common.back")}
        </Button>
        <Button type="submit">{t("common.continue")}</Button>
      </div>
    </form>
  )
}
