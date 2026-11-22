import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  markPrivacyNoticeSeen,
  profileKeys,
  type ProfileResponse,
} from "@/features/profile/api/profileApi"

/** Hides the privacy notice banner at once; if the request fails it comes back on the next fetch. */
export function useMarkPrivacyNoticeSeen(userId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markPrivacyNoticeSeen,
    onMutate: () => {
      queryClient.setQueryData<ProfileResponse>(profileKeys.me(userId), (profile) =>
        profile ? { ...profile, privacyNoticeSeenAt: new Date().toISOString() } : profile,
      )
    },
  })
}
