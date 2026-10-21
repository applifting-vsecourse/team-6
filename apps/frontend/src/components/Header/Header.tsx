import type { ReactNode } from "react"

import { HeaderLogo } from "@/components/Header/HeaderLogo"
import { HeaderNav } from "@/components/Header/HeaderNav"
import { LanguageSwitcher } from "@/components/Header/LanguageSwitcher"
import { MobileMenu } from "@/components/Header/MobileMenu"

type HeaderProps = {
  // Navigation is for signed-in users only; signed out there is nothing to list yet.
  hasNav?: boolean
  // Auth-aware slots (sign-in link / user dropdown, sheet account block). Passed in
  // so `components/` doesn't have to import from `features/auth`.
  userMenu?: ReactNode
  mobileAccount?: ReactNode
}

export function Header({ hasNav = false, userMenu, mobileAccount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background px-4">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-4 md:h-16 md:gap-10">
        <HeaderLogo />
        {hasNav ? <HeaderNav className="hidden md:flex" /> : null}
        <div className="ml-auto flex items-center gap-5">
          <LanguageSwitcher className="hidden md:flex" />
          {userMenu}
          <MobileMenu
            hasNav={hasNav}
            account={mobileAccount}
          />
        </div>
      </div>
    </header>
  )
}
