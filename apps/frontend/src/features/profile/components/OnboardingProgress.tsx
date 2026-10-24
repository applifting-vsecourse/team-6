import { cn } from "@/lib/utils"

type OnboardingProgressProps = {
  currentStep: 1 | 2 | 3
  totalSteps?: number
  className?: string
}

export function OnboardingProgress({
  currentStep,
  totalSteps = 3,
  className,
}: OnboardingProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      className={cn("flex w-full items-center gap-2", className)}
    >
      {steps.map((step) => {
        const isActive = step <= currentStep
        return (
          <div
            key={step}
            className={cn("h-1 flex-1 transition-colors", isActive ? "bg-primary" : "bg-track")}
          />
        )
      })}
    </div>
  )
}
