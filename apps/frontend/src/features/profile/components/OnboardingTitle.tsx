import { useContext } from "react"

import { GazeBlobatar } from "@/components/GazeBlobatar"

import { AvatarSeedContext } from "@/features/profile/lib/avatarSeedContext"

type OnboardingTitleProps = {
  title: string
  description: string
}

/** Page title of an onboarding step with the person's own blobatar beside it (Figma B1–B3). */
export function OnboardingTitle({ title, description }: OnboardingTitleProps) {
  const seed = useContext(AvatarSeedContext)

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-5 md:gap-x-3.5 md:gap-y-0.5">
      {seed ? (
        <GazeBlobatar
          name={seed}
          animate="always"
          className="size-12 md:row-span-2 md:size-14"
        />
      ) : null}
      <h1 className="col-start-2 text-h1-mobile text-foreground md:text-h1">{title}</h1>
      <p className="col-span-2 text-compact text-muted-foreground md:col-span-1 md:col-start-2 md:text-lead">
        {description}
      </p>
    </div>
  )
}
