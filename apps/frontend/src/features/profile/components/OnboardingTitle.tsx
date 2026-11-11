import { GazeBlobatar } from "@/components/GazeBlobatar"
import { useMascotContext } from "@/components/Mascot/MascotContext"
import { cn } from "@/lib/utils"

type OnboardingTitleProps = {
  title: string
  description: string
  // Seed of the person's own blobatar beside the page title; none hides it.
  avatarSeed?: string
}

/**
 * Page title of an onboarding step with the person's own blobatar beside it (Figma B1–B3). While
 * the tour runs the mascot is that avatar and goes from card to card, so drawing it here as well
 * would show it twice; on a repeat of onboarding, with no mascot, it is back where it always was.
 */
export function OnboardingTitle({ title, description, avatarSeed }: OnboardingTitleProps) {
  const isTourActive = useMascotContext()?.isTourActive ?? false
  const seed = isTourActive ? undefined : avatarSeed

  return (
    <div
      className={cn(
        "gap-y-5 md:gap-y-0.5",
        // Without an avatar there is no first column, so the texts must not reserve one.
        seed ? "grid grid-cols-[auto_1fr] items-center gap-x-3 md:gap-x-3.5" : "flex flex-col",
      )}
    >
      {seed ? (
        <GazeBlobatar
          name={seed}
          animate="always"
          className="size-12 md:row-span-2 md:size-14"
        />
      ) : null}
      <h1 className={cn("text-h1-mobile text-foreground md:text-h1", seed && "col-start-2")}>
        {title}
      </h1>
      <p
        className={cn(
          "text-compact text-muted-foreground md:text-lead",
          seed && "col-span-2 md:col-span-1 md:col-start-2",
        )}
      >
        {description}
      </p>
    </div>
  )
}
