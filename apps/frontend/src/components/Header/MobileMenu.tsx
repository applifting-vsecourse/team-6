import type { ReactNode } from "react"
import { Link, type LinkProps } from "@tanstack/react-router"
import { ChevronRight, Menu, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HOW_IT_WORKS_ANCHOR, ROUTES } from "@/app/routes"
import { DisabledNavItem } from "@/components/Header/DisabledNavItem"
import { LanguageSwitcher } from "@/components/Header/LanguageSwitcher"
import { NAV_ITEMS, type NavDisabled } from "@/components/Header/nav"
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"
import { LogoMark } from "@/components/LogoMark"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SUPPORT_EMAIL } from "@/config/support"
import { formatNumber } from "@/lib/date"
import { cn } from "@/lib/utils"

type MobileMenuProps = {
  hasNav?: boolean
  navDisabled?: NavDisabled
  // Present when the user's kvintet has a chat; adds "Group chat" with the unread badge.
  chat?: { unreadCount: number }
  // Signed out: the "Learn more" links.
  hasLearnMore?: boolean
  // Auth-aware slots (account card at the top, sign out at the bottom). Passed in so
  // `components/` doesn't have to import from `features/auth`.
  top?: ReactNode
  bottom?: ReactNode
}

const ROW =
  "group flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-foreground"
const DOT = "size-2 shrink-0 rounded-full bg-input"
const META_LABEL = "px-4 font-mono text-xs tracking-meta text-muted-foreground uppercase"

/** One row of a menu list: a dot, the label, an optional badge and a chevron. Closes the menu. */
function MenuLink({
  children,
  badge,
  isNav = false,
  ...props
}: LinkProps & { children: ReactNode; badge?: ReactNode; isNav?: boolean }) {
  return (
    <SheetClose asChild>
      <Link
        activeOptions={{ exact: true }}
        {...props}
        // Only the "Go to" rows show where you are; the data-status attribute is set by the router.
        className={cn(ROW, isNav && "data-[status=active]:bg-accent")}
      >
        <span
          aria-hidden
          className={cn(DOT, isNav && "group-data-[status=active]:bg-primary")}
        />
        <span className="flex-1">{children}</span>
        {badge}
        <ChevronRight
          aria-hidden
          className="size-4 text-muted-foreground"
        />
      </Link>
    </SheetClose>
  )
}

export function MobileMenu({
  hasNav = false,
  navDisabled,
  chat,
  hasLearnMore = false,
  top,
  bottom,
}: MobileMenuProps) {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t("layout.openMenu")}
        className="p-1 md:hidden"
      >
        <Menu className="size-5.5" />
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-svh gap-0 border-0"
      >
        <SheetTitle className="sr-only">{t("layout.menu")}</SheetTitle>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5 font-serif text-subheading font-medium text-foreground">
            <LogoMark />
            Kvintet
          </div>
          <SheetClose
            aria-label={t("layout.closeMenu")}
            className="p-1"
          >
            <X className="size-5.5" />
          </SheetClose>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
          {top}

          {hasNav ? (
            <nav
              aria-label={t("layout.mainNavigation")}
              className="flex flex-col gap-1"
            >
              <p className={cn(META_LABEL, "pb-1")}>{t("layout.goTo")}</p>
              {NAV_ITEMS.map((item) => {
                const reason = navDisabled?.[item.to]
                return reason ? (
                  <DisabledNavItem
                    key={item.to}
                    reason={reason}
                    className={cn(ROW, "text-muted-foreground")}
                  >
                    <span
                      aria-hidden
                      className={DOT}
                    />
                    {t(item.labelKey)}
                  </DisabledNavItem>
                ) : (
                  <MenuLink
                    key={item.to}
                    to={item.to}
                    isNav
                  >
                    {t(item.labelKey)}
                  </MenuLink>
                )
              })}
              {chat ? (
                <MenuLink
                  to={ROUTES.kvintetMessages}
                  isNav
                  badge={
                    chat.unreadCount > 0 ? (
                      // `primary` here follows the design's blue badge, not an action.
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm font-medium text-primary-foreground">
                        <span className="sr-only">
                          {t("layout.unreadMessages", { count: chat.unreadCount })}
                        </span>
                        <span aria-hidden>{formatNumber(chat.unreadCount)}</span>
                      </span>
                    ) : null
                  }
                >
                  {t("layout.groupChat")}
                </MenuLink>
              ) : null}
            </nav>
          ) : null}

          {hasLearnMore ? (
            <nav
              aria-label={t("layout.learnMore")}
              className="flex flex-col gap-1"
            >
              <p className={cn(META_LABEL, "pb-1")}>{t("layout.learnMore")}</p>
              <MenuLink
                to={ROUTES.home}
                hash={HOW_IT_WORKS_ANCHOR}
              >
                {t("layout.howItWorks")}
              </MenuLink>
              <MenuLink to={ROUTES.codeOfConduct}>{t("layout.communityRules")}</MenuLink>
            </nav>
          ) : null}

          <section className="flex flex-col gap-2">
            <p className={META_LABEL}>{t("layout.settings")}</p>
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-base text-foreground">{t("common.language")}</span>
                <LanguageSwitcher variant="pills" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-base text-foreground">{t("common.theme")}</span>
                <ThemeSwitcher variant="pills" />
              </div>
            </div>
          </section>

          <div className="mt-auto flex flex-col gap-4 pt-6">
            {bottom}
            <div className="flex justify-center gap-5 text-sm text-muted-foreground">
              <SheetClose asChild>
                <Link
                  to={ROUTES.codeOfConduct}
                  className="hover:underline"
                >
                  {t("layout.rules")}
                </Link>
              </SheetClose>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="hover:underline"
              >
                {t("layout.support")}
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
