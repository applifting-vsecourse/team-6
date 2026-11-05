import { Link } from "@tanstack/react-router"
import { sleepy } from "blobatar/expression"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Blobatar } from "@/components/ui/blobatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SheetClose } from "@/components/ui/sheet"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

// A person is always drawn from the same string, so the header, the menus and the chat agree.
// An empty username falls back to the id, hence `||` and not `??`.
const seedOf = (user: { id: string; username: string }) => user.username || user.id

// Decorative faces for the signed-out menu: the three shapes and colours the Figma shows.
const GUEST_SEEDS = ["jana", "petr", "eva"] as const

export function HeaderMenu() {
  const { t } = useTranslation()
  const { user } = useSession()
  const signOut = useSignOut()

  if (!user) {
    return (
      <>
        <Link
          to={ROUTES.login}
          className="text-label font-medium text-foreground md:px-4.5 md:py-2.75"
        >
          {t("auth.signIn")}
        </Link>
        <Button
          asChild
          className="hidden md:inline-flex"
        >
          <Link to={ROUTES.signup}>{t("auth.signUp")}</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      {/* On a phone the avatar only says who is signed in; the menu holds everything else. */}
      <Blobatar
        name={seedOf(user)}
        className="size-8 md:hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="hidden h-auto gap-2.5 p-0 text-label font-medium text-foreground hover:bg-transparent has-[>svg]:px-0 md:inline-flex"
          >
            <GazeBlobatar
              name={seedOf(user)}
              animate="hover"
              travel={7}
              className="size-7.5"
            />
            {user.name.split(" ")[0]}
            <span
              aria-hidden
              className="text-small font-normal text-muted-foreground"
            >
              ▾
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60"
        >
          <DropdownMenuLabel className="flex items-center gap-3 p-2.5">
            <Blobatar
              name={seedOf(user)}
              className="size-8"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-none font-medium">{user.name}</span>
              {user.username ? (
                <span className="mt-1 truncate text-xs text-muted-foreground">
                  @{user.username}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut.mutate()}
            disabled={signOut.isPending}
          >
            <LogOut className="size-4" />
            {t("auth.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

/** Onboarding header: nothing but a way out. The mobile menu has its own sign out. */
export function OnboardingSignOut() {
  const { t } = useTranslation()
  const signOut = useSignOut()

  return (
    <Button
      variant="ghost"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
      className="hidden h-auto p-0 text-label font-normal text-muted-foreground hover:bg-transparent hover:text-foreground md:inline-flex"
    >
      {t("auth.signOut")}
    </Button>
  )
}

/** Top of the mobile menu: who is signed in, or an invitation to join. */
export function MobileAccount() {
  const { t } = useTranslation()
  const { user } = useSession()

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4.5">
        <div
          aria-hidden
          className="flex items-center"
        >
          {GUEST_SEEDS.map((seed) => (
            <Blobatar
              key={seed}
              name={seed}
              className="-mr-2 size-10 last:mr-0"
              blobatar={{ expression: sleepy }}
            />
          ))}
        </div>
        <p className="text-lg font-semibold text-foreground">{t("layout.findYourKvintet")}</p>
        <div className="flex w-full flex-col gap-2.5">
          <SheetClose asChild>
            <Button asChild>
              <Link to={ROUTES.signup}>{t("layout.createAccount")}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              asChild
              variant="outline"
            >
              <Link to={ROUTES.login}>{t("auth.signIn")}</Link>
            </Button>
          </SheetClose>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Blobatar
        name={seedOf(user)}
        className="size-12"
      />
      <div className="flex min-w-0 flex-col">
        <p className="truncate font-semibold text-foreground">{user.name}</p>
        {user.username ? (
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        ) : null}
      </div>
    </div>
  )
}

/** Bottom of the mobile menu, signed in only. */
export function MobileSignOut() {
  const { t } = useTranslation()
  const { user } = useSession()
  const signOut = useSignOut()

  if (!user) return null

  return (
    <Button
      variant="outline"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
    >
      {t("auth.signOut")}
    </Button>
  )
}
