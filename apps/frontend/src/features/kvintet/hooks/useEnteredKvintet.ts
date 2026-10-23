import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

/**
 * What happens once the caller is a member (joined or started a kvintet): confirm,
 * mark the caller as a member (the header greys out Kvintets), navigate to "My kvintet",
 * then drop the feed cache. The feed answers 409 to members, so it must
 * not refetch while still mounted.
 */
export function useEnteredKvintet() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async (message: string) => {
    toast.success(message)
    queryClient.setQueryData(kvintetKeys.membership(), { isMember: true })
    await navigate({ to: ROUTES.myKvintet })
    queryClient.removeQueries({ queryKey: kvintetKeys.feed() })
    void queryClient.invalidateQueries({ queryKey: kvintetKeys.mine() })
  }
}
