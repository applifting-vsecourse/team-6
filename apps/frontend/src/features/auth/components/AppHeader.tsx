import { Header } from "@/components/Header/Header"
import type { NavDisabled } from "@/components/Header/nav"

import { HeaderMenu, MobileAccount } from "@/features/auth/components/HeaderMenu"
import { useSession } from "@/features/auth/hooks/useSession"

type AppHeaderProps = {
  // The sign-in page leaves the account link out: offering "Sign in" there is noise.
  hasAccount?: boolean
  // Nav items to show as unavailable, decided by the page layout (features can't import each other).
  navDisabled?: NavDisabled
}

export function AppHeader({ hasAccount = true, navDisabled }: AppHeaderProps) {
  const { user } = useSession()

  if (!hasAccount) return <Header />

  return (
    <Header
      hasNav={Boolean(user)}
      navDisabled={navDisabled}
      userMenu={<HeaderMenu />}
      mobileAccount={<MobileAccount />}
    />
  )
}
