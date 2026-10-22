import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/errorMessage"

import {
  profileQueryOptions,
  referenceQueryOptions,
  useSaveProfile,
  type City,
  type MeetingFrequency,
  type ProfileResponse,
  type Tag,
} from "@/features/profile/api/profileApi"
import { OnboardingProgress } from "@/features/profile/components/OnboardingProgress"
import { Step1Profile } from "@/features/profile/components/Step1Profile"
import { Step2Availability } from "@/features/profile/components/Step2Availability"
import { Step3Questionnaire } from "@/features/profile/components/Step3Questionnaire"

type OnboardingWizardProps = {
  userId?: string
}

export function OnboardingWizard({ userId }: OnboardingWizardProps = {}) {
  const referenceQuery = useQuery(referenceQueryOptions())
  const profileQuery = useQuery(profileQueryOptions(userId))

  if (referenceQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 py-8">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (referenceQuery.isError || profileQuery.isError) {
    return (
      <Alert
        variant="destructive"
        className="my-8"
      >
        <AlertDescription>
          {getErrorMessage(referenceQuery.error ?? profileQuery.error)}
        </AlertDescription>
      </Alert>
    )
  }

  const allTags = referenceQuery.data?.tags ?? []
  const allCities = referenceQuery.data?.cities ?? []

  return (
    <OnboardingWizardForm
      userId={userId}
      profile={profileQuery.data ?? null}
      allTags={allTags}
      allCities={allCities}
    />
  )
}

type OnboardingWizardFormProps = {
  userId?: string
  profile: ProfileResponse
  allTags: Tag[]
  allCities: City[]
}

function OnboardingWizardForm({ userId, profile, allTags, allCities }: OnboardingWizardFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const saveProfileMutation = useSaveProfile(userId)

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const wizardTopRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo?.({ top: 0, left: 0, behavior: "smooth" })
      document.documentElement?.scrollTo?.({ top: 0, left: 0, behavior: "smooth" })
      wizardTopRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    }

    scrollToTop()
    const timer = setTimeout(scrollToTop, 50)
    return () => clearTimeout(timer)
  }, [currentStep])

  const [step1Data, setStep1Data] = useState<{
    roles?: string[]
    position?: string
    teachTagIds: string[]
    learnTagIds: string[]
    interestTagIds: string[]
  }>({
    roles: profile?.roles ?? (profile?.position ? [profile.position] : []),
    position: profile?.position ?? "",
    teachTagIds: profile?.teaches?.map((t) => t.id) ?? [],
    learnTagIds: profile?.learns?.map((t) => t.id) ?? [],
    interestTagIds: profile?.interests?.map((t) => t.id) ?? [],
  })

  const [step2Data, setStep2Data] = useState<{
    weekdays: boolean
    weekends: boolean
    mornings: boolean
    afternoons: boolean
    evenings: boolean
    cityId?: string | null
    radiusKm: number
    latitude?: number | null
    longitude?: number | null
  }>({
    weekdays: profile?.weekdays ?? false,
    weekends: profile?.weekends ?? false,
    mornings: profile?.mornings ?? false,
    afternoons: profile?.afternoons ?? false,
    evenings: profile?.evenings ?? false,
    cityId: profile?.cityId ?? null,
    radiusKm: profile?.radiusKm ?? 25,
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  })

  const [step3Data, setStep3Data] = useState<{
    expectations: string[]
    meetingFrequency?: MeetingFrequency
    note: string
  }>({
    expectations: profile?.expectations ?? [],
    meetingFrequency: profile?.meetingFrequency ?? undefined,
    note: profile?.note ?? "",
  })

  const handleStep1Continue = (data: typeof step1Data) => {
    setStep1Data(data)
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStep2Continue = (data: typeof step2Data) => {
    setStep2Data(data)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFinish = async (data: typeof step3Data) => {
    setStep3Data(data)
    setErrorMessage(null)

    try {
      await saveProfileMutation.mutateAsync({
        roles: step1Data.roles,
        position: step1Data.roles?.[0] ?? step1Data.position,
        teachTagIds: step1Data.teachTagIds,
        learnTagIds: step1Data.learnTagIds,
        interestTagIds: step1Data.interestTagIds,
        weekdays: step2Data.weekdays,
        weekends: step2Data.weekends,
        mornings: step2Data.mornings,
        afternoons: step2Data.afternoons,
        evenings: step2Data.evenings,
        cityId: step2Data.cityId ?? null,
        radiusKm: step2Data.radiusKm,
        latitude: step2Data.latitude ?? null,
        longitude: step2Data.longitude ?? null,
        expectations: data.expectations,
        meetingFrequency: data.meetingFrequency,
        note: data.note,
        completeOnboarding: true,
      })

      await navigate({ to: ROUTES.overview })
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  return (
    <div
      ref={wizardTopRef}
      className="flex scroll-mt-6 flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
          {t("onboarding.stepProgress", { current: currentStep, total: 3 })}
        </p>
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={3}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {currentStep === 1 && (
        <Step1Profile
          initialData={step1Data}
          allTags={allTags}
          onContinue={handleStep1Continue}
        />
      )}

      {currentStep === 2 && (
        <Step2Availability
          initialData={step2Data}
          cities={allCities}
          onBack={() => {
            setCurrentStep(1)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
          onContinue={handleStep2Continue}
        />
      )}

      {currentStep === 3 && (
        <Step3Questionnaire
          initialData={step3Data}
          isSubmitting={saveProfileMutation.isPending}
          onBack={() => {
            setCurrentStep(2)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}
