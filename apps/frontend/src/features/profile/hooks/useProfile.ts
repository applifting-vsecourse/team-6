import { useQuery } from "@tanstack/react-query"

import { profileQueryOptions } from "@/features/profile/api/profileApi"

export const useProfile = (userId?: string) => {
  const query = useQuery(profileQueryOptions(userId))
  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
