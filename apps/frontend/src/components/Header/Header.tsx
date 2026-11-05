import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { HeaderLogo } from "@/components/Header/HeaderLogo"
import { HeaderNav } from "@/components/Header/HeaderNav"
import { LanguageSwitcher } from "@/components/Header/LanguageSwitcher"
import { MobileMenu } from "@/components/Header/MobileMenu"
import type { NavDisabled } from "@/components/Header/nav"
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"

type HeaderProps = {
  // Navigation is for signed-in users only; signed out there is nothing to list yet.
  hasNav?: boolean
  // Items that stay visible but can't be used right now, with the reason for a tooltip.
  navDisabled?: NavDisabled
  // Onboarding: shows "Step 1 of 3" next to the logo.
  step?: { current: number; total: number }
  // Present when the user's kvintet has a chat: the mobile menu gets "Group chat" and its badge.
  chat?: { unreadCount: number }
  // Signed out: the mobile menu gets the "Learn more" links.
  hasLearnMore?: boolean
  // Auth-aware slots (sign-in link / user dropdown, mobile menu account card and sign out).
  // Passed in so `components/` doesn't have to import from `features/auth`.
  userMenu?: ReactNode
  mobileTop?: ReactNode
  mobileBottom?: ReactNode
}

export function Header({
  hasNav = false,
  navDisabled,
  step,
  chat,
  hasLearnMore,
  userMenu,
  mobileTop,
  mobileBottom,
}: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background px-4">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 md:h-16 md:gap-7">
        <div className="flex items-center gap-3">
          <HeaderLogo />
          {step ? (
            <p className="font-mono text-meta tracking-meta text-muted-foreground uppercase">
              <span className="hidden md:inline">
                {t("onboarding.stepProgress", { current: step.current, total: step.total })}
              </span>
              <span className="md:hidden">
                {t("onboarding.stepShort", { current: step.current, total: step.total })}
              </span>
            </p>
          ) : null}
        </div>
        {hasNav ? (
          <HeaderNav
            className="hidden md:flex"
            disabledItems={navDisabled}
          />
        ) : null}
        <div className="ml-auto flex items-center gap-3 md:gap-4.5">
          <LanguageSwitcher className="hidden md:flex" />
          <ThemeSwitcher className="hidden md:inline-flex" />
          {userMenu}
          <MobileMenu
            hasNav={hasNav}
            navDisabled={navDisabled}
            chat={chat}
            hasLearnMore={hasLearnMore}
            top={mobileTop}
            bottom={mobileBottom}
          />
        </div>
      </div>
    </header>
  )
}
