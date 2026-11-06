import { Header } from "@/components/Header/Header"
import type { NavDisabled } from "@/components/Header/nav"

import {
  HeaderMenu,
  MobileAccount,
  MobileSignOut,
  OnboardingSignOut,
} from "@/features/auth/components/HeaderMenu"
import { useSession } from "@/features/auth/hooks/useSession"

type AppHeaderProps = {
  // The sign-in page leaves the account link out: offering "Sign in" there is noise.
  hasAccount?: boolean
  // Nav items to show as unavailable, decided by the page layout (features can't import each other).
  navDisabled?: NavDisabled
  // Onboarding: swaps the nav for the step counter and a sign-out link.
  onboardingStep?: { current: number; total: number }
  // The user's kvintet has a chat; the unread count comes from the layout for the same reason.
  chat?: { unreadCount: number }
}

export function AppHeader({
  hasAccount = true,
  navDisabled,
  onboardingStep,
  chat,
}: AppHeaderProps) {
  const { user } = useSession()

  if (!hasAccount) return <Header hasLearnMore />

  const isOnboarding = Boolean(user && onboardingStep)

  return (
    <Header
      hasNav={Boolean(user) && !isOnboarding}
      navDisabled={navDisabled}
      step={isOnboarding ? onboardingStep : undefined}
      chat={chat}
      hasLearnMore={!user}
      userMenu={isOnboarding ? <OnboardingSignOut /> : <HeaderMenu />}
      mobileTop={<MobileAccount />}
      mobileBottom={<MobileSignOut />}
    />
  )
}
