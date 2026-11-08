import { useQuery } from "@tanstack/react-query"

import { membershipQueryOptions } from "@/features/kvintet/api/membershipQueryOptions"

/** Whether the caller is already in a kvintet; false until the server says so. */
export function useKvintetMembership(isEnabled = true) {
  const { data } = useQuery({ ...membershipQueryOptions(), enabled: isEnabled })
  return { isMember: data?.isMember ?? false }
}
