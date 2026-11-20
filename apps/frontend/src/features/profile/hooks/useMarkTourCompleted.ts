import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  markTourCompleted,
  profileKeys,
  type ProfileResponse,
} from "@/features/profile/api/profileApi"

/**
 * Tells the server the product tour is over. The cache is updated at once, so the mascot does not
 * come back while the request is on its way; if it fails, the next profile fetch brings the tour
 * back and it asks again.
 */
export function useMarkTourCompleted(userId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markTourCompleted,
    onMutate: () => {
      queryClient.setQueryData<ProfileResponse>(profileKeys.me(userId), (profile) =>
        profile ? { ...profile, tourCompletedAt: new Date().toISOString() } : profile,
      )
    },
  })
}
