import { Header } from "@/components/Header/Header"

import { HeaderMenu, MobileAccount } from "@/features/auth/components/HeaderMenu"
import { useSession } from "@/features/auth/hooks/useSession"

type AppHeaderProps = {
  // The sign-in page leaves the account link out: offering "Sign in" there is noise.
  hasAccount?: boolean
}

export function AppHeader({ hasAccount = true }: AppHeaderProps) {
  const { user } = useSession()

  if (!hasAccount) return <Header />

  return (
    <Header
      hasNav={Boolean(user)}
      userMenu={<HeaderMenu />}
      mobileAccount={<MobileAccount />}
    />
  )
}
