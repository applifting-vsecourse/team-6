import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"

import { AppHeader } from "@/features/auth/components/AppHeader"
import { useSession } from "@/features/auth/hooks/useSession"
import { useUnreadMessages } from "@/features/chat/hooks/useUnread"
import { useKvintetMembership } from "@/features/kvintet/hooks/useKvintetMembership"

type SiteHeaderProps = {
  hasAccount?: boolean
  onboardingStep?: { current: number; total: number }
}

/**
 * The app header on every page that shows it, so a member sees the same thing on the landing
 * page as in the app: "Kvintets" unavailable and the unread count. It lives here because the
 * header's feature may not import the kvintet and chat features.
 */
export function SiteHeader({ hasAccount, onboardingStep }: SiteHeaderProps) {
  const { t } = useTranslation()
  const { user } = useSession()
  const { isMember } = useKvintetMembership(Boolean(user))
  // Members can't browse other kvintets; say so instead of letting the page bounce them.
  const navDisabled = isMember ? { [ROUTES.kvintetFeed]: t("nav.kvintetFeedDisabled") } : undefined
  // Only members have a chat; the same poll says whether it has opened yet.
  const { isChatActive, unreadCount } = useUnreadMessages(isMember)

  return (
    <AppHeader
      hasAccount={hasAccount}
      navDisabled={navDisabled}
      chat={isChatActive ? { unreadCount } : undefined}
      onboardingStep={onboardingStep}
    />
  )
}
