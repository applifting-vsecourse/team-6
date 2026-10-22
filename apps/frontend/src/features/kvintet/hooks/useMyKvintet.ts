import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  leaveKvintet,
  myKvintetQueryOptions,
  voteToStartKvintet,
} from "@/features/kvintet/api/kvintetApi"
import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

export function useMyKvintet() {
  const queryClient = useQueryClient()
  const query = useQuery(myKvintetQueryOptions())

  const voteMutation = useMutation({
    mutationFn: voteToStartKvintet,
    onSuccess: (updated) => {
      queryClient.setQueryData(kvintetKeys.mine(), updated)
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.mine() })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: leaveKvintet,
    onSuccess: () => {
      queryClient.setQueryData(kvintetKeys.mine(), null)
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.mine() })
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.membership() })
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.feed() })
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending,
    voteError: voteMutation.error,
    leave: leaveMutation.mutate,
    isLeaving: leaveMutation.isPending,
    leaveError: leaveMutation.error,
  }
}
