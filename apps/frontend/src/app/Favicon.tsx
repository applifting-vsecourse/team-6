import { useEffect, useSyncExternalStore } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { MASCOT_SEED } from "@/components/Mascot/MascotContext"
import { authKeys } from "@/lib/auth-keys"
import { faviconHref } from "@/lib/favicon"

import type { Session } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"

/**
 * The tab icon is the yellow mascot until someone has a username, then their own avatar.
 *
 * Known limitation: Safari does not re-read a favicon that changes after the page has loaded (a
 * WebKit behaviour; a PNG from a canvas and alternating `rel` did not help either), so there the
 * new avatar shows from the next page load. Chrome and Firefox update at once.
 */
export function Favicon() {
  const queryClient = useQueryClient()
  // Keeps the session query mounted and fetching. Its result is not used: sign-in, sign-up and
  // sign-out call `queryClient.clear()`, which leaves this observer on a removed query and, since
  // nothing here re-renders, it would show the old person until a reload. The cache itself is
  // what we follow.
  useSession()
  const seed = useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    // An empty username counts as none, hence `||` and not `??` on the string.
    () =>
      (queryClient.getQueryData<Session>(authKeys.session())?.user.username ?? "") || MASCOT_SEED,
  )

  useEffect(() => {
    // A new element, not a new `href` on the old one: Chrome does not re-read the icon when a
    // link is edited in place.
    const link = document.createElement("link")
    link.rel = "icon"
    link.type = "image/svg+xml"
    link.setAttribute("sizes", "any")
    link.href = faviconHref(seed)
    document.head.querySelector('link[rel="icon"][type="image/svg+xml"]')?.remove()
    document.head.appendChild(link)
  }, [seed])

  return null
}
