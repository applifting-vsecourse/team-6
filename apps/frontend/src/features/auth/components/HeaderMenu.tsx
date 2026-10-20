import { Link } from "@tanstack/react-router"
import { ChevronDown, LogOut } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"

export function HeaderMenu() {
  const { user } = useSession()
  const signOut = useSignOut()

  if (!user) {
    return (
      <Link
        to={ROUTES.login}
        className="text-label font-semibold text-foreground"
      >
        Přihlásit se
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden text-sm font-normal text-body md:inline-flex"
        >
          {user.name}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm leading-none font-medium">{user.name}</span>
            <span className="mt-1 text-xs text-muted-foreground">@{user.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          <LogOut className="size-4" />
          Odhlásit se
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Account block of the mobile menu sheet: who is signed in, and sign out. */
export function MobileAccount() {
  const { user } = useSession()
  const signOut = useSignOut()

  if (!user) return null

  return (
    <div className="flex flex-col gap-0.5 border-t border-border pt-4">
      <p className="font-semibold text-foreground">{user.name}</p>
      <Button
        variant="link"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        className="h-auto self-start p-0 text-body underline"
      >
        Odhlásit se
      </Button>
    </div>
  )
}
