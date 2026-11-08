import { useMutation, useQueryClient } from "@tanstack/react-query"

import { markBeginsSeen, type KvintetDetails } from "@/features/kvintet/api/kvintetApi"
import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

/**
 * Tells the server the "Kvintet begins" page has been seen. The cache is updated at once, so
 * "See members" on the page does not bounce back here while the request is on its way; if it
 * fails, the next poll of the kvintet on Home brings the page back and it asks again.
 */
export function useMarkBeginsSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markBeginsSeen,
    onMutate: () => {
      queryClient.setQueryData<KvintetDetails | null>(kvintetKeys.mine(), (kvintet) =>
        kvintet ? { ...kvintet, beginsSeen: true } : kvintet,
      )
    },
  })
}
